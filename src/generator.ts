#!/usr/bin/env node
/**
 * This code is based on the following code by @Jyrno42
 * https://github.com/prisma/prisma/issues/8703#issuecomment-1614360386
 *
 * This is a workaround to have https://github.com/prisma/prisma/issues/8703 before it is implemented
 * in Prisma itself.
 */

import {
  EnvValue,
  generatorHandler,
  GeneratorOptions,
} from "@prisma/generator-helper";
import { parseEnvValue } from "@prisma/internals";
import fs from "fs";
import path from "path";
import { version } from "../package.json";
import {
  AllTargets,
  Comments,
  createComments,
  diffComments,
  Target,
} from "./comment";
import { parse } from "./parser";
import { DatabaseProvider, generateCommentStatements } from "./statement";

const generate = async ({
  generator,
  dmmf,
  schemaPath,
  datasources,
}: GeneratorOptions) => {
  const outputDir = parseEnvValue(generator.output as EnvValue);
  fs.mkdirSync(outputDir, { recursive: true });

  const targets: readonly Target[] = Array.isArray(generator.config.targets)
    ? (generator.config.targets as Target[])
    : AllTargets;

  let ignorePattern;
  if (
    generator.config.ignorePattern &&
    typeof generator.config.ignorePattern === "string"
  ) {
    ignorePattern = new RegExp(generator.config.ignorePattern);
  }

  let ignoreCommentPattern;
  if (
    generator.config.ignoreCommentPattern &&
    typeof generator.config.ignoreCommentPattern === "string"
  ) {
    ignoreCommentPattern = new RegExp(generator.config.ignoreCommentPattern);
  }

  let includeEnumInFieldComment = false;
  if (
    generator.config.includeEnumInFieldComment &&
    typeof generator.config.includeEnumInFieldComment === "string"
  ) {
    includeEnumInFieldComment =
      generator.config.includeEnumInFieldComment === "true";
  }

  const models = parse(dmmf.datamodel);
  const currentComments = createComments(models, targets, {
    ignorePattern,
    ignoreCommentPattern,
    includeEnumInFieldComment,
  });

  // load latest
  const latestFilePath = path.join(outputDir, "comments-latest.json");
  let latestComments: Comments;
  if (fs.existsSync(latestFilePath)) {
    const json = fs.readFileSync(latestFilePath, "utf-8");
    latestComments = JSON.parse(json);
  } else {
    latestComments = {};
  }

  const diff = diffComments(currentComments, latestComments);

  // データベースプロバイダーを取得
  const provider: DatabaseProvider =
    datasources.length > 0
      ? datasources[0].activeProvider === "mysql"
        ? "mysql"
        : "postgresql"
      : "postgresql";

  const commentStatements = generateCommentStatements(diff, provider);

  if (commentStatements.length === 0) {
    console.log(
      "No changes detected, skipping creating a fresh comments migration...",
    );
    return;
  }

  const migrationDirName = await outputMigrationFile(
    path.dirname(schemaPath),
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
  baseDirPath: string,
  commentStatements: string[],
) => {
  const date = new Date();
  date.setMilliseconds(0);

  const dateStr = date
    .toISOString()
    .replace(/[:\-TZ]/g, "")
    .replace(".000", "");
  const dirName = `${dateStr}_update_comments`;

  const migrationDir = path.join(baseDirPath, "migrations", dirName);
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
