import { EnvValue, GeneratorOptions } from "@prisma/generator-helper";
import { parseEnvValue } from "@prisma/internals";
import { AllTargets, Target } from "./comment";
import { DatabaseProvider } from "./statement";

export interface Config {
  targets: readonly Target[];
  ignorePattern?: RegExp;
  ignoreCommentPattern?: RegExp;
  includeEnumInFieldComment: boolean;
  provider: DatabaseProvider;
  outputDir: string;
}

export const readConfig = ({
  generator,
  datasources,
}: Pick<GeneratorOptions, "generator" | "datasources">): Config => {
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
    includeEnumInFieldComment,
    provider,
    outputDir,
  };
};
