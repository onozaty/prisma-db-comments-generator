import { EnvValue, GeneratorOptions } from "@prisma/generator-helper";
import { parseEnvValue } from "@prisma/internals";
import path from "path";
import { AllTargets, CommentTransformFn, Target } from "./comment";
import { DatabaseProvider } from "./statement";

export interface Config {
  targets: readonly Target[];
  ignorePattern?: RegExp;
  ignoreCommentPattern?: RegExp;
  commentRemovePattern?: RegExp;
  commentTransformFn?: CommentTransformFn;
  includeEnumInFieldComment: boolean;
  provider: DatabaseProvider;
  outputDir: string;
}

export const readConfig = async ({
  generator,
  datasources,
}: Pick<GeneratorOptions, "generator" | "datasources">): Promise<Config> => {
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

  let commentRemovePattern;
  if (
    generator.config.commentRemovePattern &&
    typeof generator.config.commentRemovePattern === "string"
  ) {
    commentRemovePattern = new RegExp(generator.config.commentRemovePattern);
  }

  let commentTransformFn: CommentTransformFn | undefined;
  if (
    generator.config.commentTransformScript &&
    typeof generator.config.commentTransformScript === "string"
  ) {
    const scriptPath = path.resolve(
      path.dirname(generator.sourceFilePath),
      generator.config.commentTransformScript,
    );
    let mod: unknown;
    try {
      mod = await import(scriptPath);
    } catch (e) {
      throw new Error(
        `Failed to load commentTransformScript: ${scriptPath}\n${e}`,
      );
    }
    const fn =
      mod != null &&
      typeof (mod as { default?: unknown }).default === "function"
        ? (mod as { default: CommentTransformFn }).default
        : typeof mod === "function"
          ? (mod as CommentTransformFn)
          : undefined;
    if (!fn) {
      throw new Error(
        `commentTransformScript must export a function: ${scriptPath}`,
      );
    }
    commentTransformFn = fn;
  }

  let includeEnumInFieldComment = false;
  if (
    generator.config.includeEnumInFieldComment &&
    typeof generator.config.includeEnumInFieldComment === "string"
  ) {
    includeEnumInFieldComment =
      generator.config.includeEnumInFieldComment === "true";
  }

  const provider: DatabaseProvider =
    datasources.length > 0
      ? datasources[0].activeProvider === "mysql"
        ? "mysql"
        : "postgresql"
      : "postgresql";

  const outputDir = parseEnvValue(generator.output as EnvValue);

  return {
    targets,
    ignorePattern,
    ignoreCommentPattern,
    commentRemovePattern,
    commentTransformFn,
    includeEnumInFieldComment,
    provider,
    outputDir,
  };
};
