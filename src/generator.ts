#!/usr/bin/env node
/**
 * This code is based on the following code by @Jyrno42
 * https://github.com/prisma/prisma/issues/8703#issuecomment-1614360386
 *
 * This is a workaround to have https://github.com/prisma/prisma/issues/8703 before it is implemented
 * in Prisma itself.
 */

import { generatorHandler, GeneratorOptions } from "@prisma/generator-helper";
import fs from "fs";
import path from "path";
import { version } from "../package.json";
import { Comments, createComments, diffComments } from "./comment";
import { readConfig } from "./config";
import { parse } from "./parser";
import { generateCommentStatements } from "./statement";

const generate = async (options: GeneratorOptions) => {
  const { dmmf } = options;
  const config = readConfig(options);

  fs.mkdirSync(config.outputDir, { recursive: true });

  const models = parse(dmmf.datamodel);
  const currentComments = createComments(models, config);

  // load latest
  const latestFilePath = path.join(config.outputDir, "comments-latest.json");
  let latestComments: Comments;
  if (fs.existsSync(latestFilePath)) {
    const json = fs.readFileSync(latestFilePath, "utf-8");
    latestComments = JSON.parse(json);
  } else {
    latestComments = {};
  }

  const diff = diffComments(currentComments, latestComments);

  const commentStatements = generateCommentStatements(diff, config.provider);

  if (commentStatements.length === 0) {
    console.log(
      "No changes detected, skipping creating a fresh comments migration...",
    );
    return;
  }

  const migrationDirName = await outputMigrationFile(
    config.outputDir,
    commentStatements,
  );

  // update latest
  fs.writeFileSync(
    latestFilePath,
    JSON.stringify(currentComments, null, 2),
    "utf-8",
  );

  console.log(`Comments generation completed: ${migrationDirName}`);
};

const outputMigrationFile = async (
  migrationsDir: string,
  commentStatements: string[],
) => {
  const date = new Date();
  date.setMilliseconds(0);

  const dateStr = date
    .toISOString()
    .replace(/[:\-TZ]/g, "")
    .replace(".000", "");
  const dirName = `${dateStr}_update_comments`;

  const migrationDir = path.join(migrationsDir, dirName);
  fs.mkdirSync(migrationDir, { recursive: true });
  fs.writeFileSync(
    path.join(migrationDir, "migration.sql"),
    `-- Prisma Database Comments Generator v${version}\n\n` +
      commentStatements.join("\n"),
    "utf-8",
  );

  return dirName;
};

generatorHandler({
  onManifest: () => ({
    version: `v${version}`,
    defaultOutput: "migrations",
    prettyName: "Prisma Database Comments",
  }),
  onGenerate: generate,
});
