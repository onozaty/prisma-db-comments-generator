/**
 * This code is based on the following code by @Jyrno42
 * https://github.com/prisma/prisma/issues/8703#issuecomment-1614360386
 *
 * This is a workaround to have https://github.com/prisma/prisma/issues/8703 before it is implemented
 * in Prisma itself.
 */

import {
  EnvValue,
  GeneratorOptions,
  generatorHandler,
} from "@prisma/generator-helper";
import { parseEnvValue } from "@prisma/internals";
import { promises as fs } from "fs";
import path from "path";
import { version } from "../package.json";
import { Comments, createComments, diffComments } from "./comment";
import { parse } from "./parser";

const generateCommentStatements = (comments: Comments): string[] => {
  const commentStatements: string[] = [];

  for (const tableName in comments) {
    const { table, columns } = comments[tableName];

    commentStatements.push(`-- ${tableName} comments`);
    if (table) {
      // ON TABLE
      commentStatements.push(
        `COMMENT ON TABLE "${table.tableName}" IS ${commentValue(table.comment)};`,
      );
    }

    if (columns) {
      for (const column of columns) {
        // ON COLUMN
        commentStatements.push(
          `COMMENT ON COLUMN "${column.tableName}"."${column.columnName}" IS ${commentValue(column.comment)};`,
        );
      }
    }

    commentStatements.push("");
  }

  return commentStatements;
};

const commentValue = (comment?: string) => {
  if (comment) {
    return `'${escapeComment(comment)}'`;
  } else {
    return "NULL";
  }
};

const escapeComment = (comment: string) => {
  return comment.replace(/'/g, "''");
};

const exists = async (path: string) => {
  try {
    await fs.access(path);
    return true;
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "ENOENT"
    ) {
      return false;
    }

    throw err;
  }
};

const generate = async ({ generator, dmmf, schemaPath }: GeneratorOptions) => {
  const outputDir = parseEnvValue(generator.output as EnvValue);
  await fs.mkdir(outputDir, { recursive: true });

  const targets = Array.isArray(generator.config.targets)
    ? generator.config.targets
    : ["table", "column"];

  const models = parse(dmmf.datamodel);
  const currentComments = createComments(models);

  // load latest
  const latestFilePath = path.join(outputDir, "comments-latest.json");
  let latestComments: Comments;
  if (await exists(latestFilePath)) {
    const json = await fs.readFile(latestFilePath, "utf-8");
    latestComments = JSON.parse(json);
  } else {
    latestComments = {};
  }

  const diff = diffComments(currentComments, latestComments);

  const commentStatements = generateCommentStatements(diff);

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
  await fs.writeFile(
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
  await fs.mkdir(migrationDir, { recursive: true });
  await fs.writeFile(
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
