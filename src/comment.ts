import { Config } from "./config";
import { Field, Model } from "./parser";

export type CommentTransformContext = {
  type: "table" | "column";
  tableName: string;
  columnName?: string;
  schema?: string;
};

export type CommentTransformFn = (
  comment: string,
  context: CommentTransformContext,
) => string;

export type Comments = {
  [key: string]: TableComments;
};

export type TableComments = {
  table?: TableComment;
  columns?: ColumnComment[];
};

export type TableComment = {
  schema?: string;
  tableName: string;
  comment: string;
};

export type ColumnComment = {
  schema?: string;
  tableName: string;
  columnName: string;
  comment: string;
};

export const AllTargets = ["table", "column"] as const;
export type Target = (typeof AllTargets)[number];

export const createComments = (
  models: readonly Model[],
  {
    targets,
    ignorePattern,
    ignoreCommentPattern,
    commentRemovePattern,
    commentTransformFn,
    includeEnumInFieldComment,
  }: Omit<Config, "provider" | "outputDir">,
): Comments => {
  const comments: Comments = {};

  for (const model of models) {
    if (ignorePattern && ignorePattern.test(model.dbName)) {
      continue;
    }

    comments[`${model.schema ? model.schema + "." : ""}${model.dbName}`] = {
      table: targets.includes("table")
        ? {
            schema: model.schema,
            tableName: model.dbName,
            comment: createModelCommentString(model, {
              ignoreCommentPattern,
              commentRemovePattern,
              commentTransformFn,
            }),
          }
        : undefined,
      columns: targets.includes("column")
        ? model.fields.map((field) => {
            return {
              schema: model.schema,
              tableName: model.dbName,
              columnName: field.dbName,
              comment: createFieldCommentString(field, model, {
                ignoreCommentPattern,
                includeEnumInFieldComment,
                commentRemovePattern,
                commentTransformFn,
              }),
            };
          })
        : undefined,
    };
  }

  return comments;
};

const applyCommentTransform = (
  comment: string,
  {
    commentRemovePattern,
    commentTransformFn,
  }: Pick<Config, "commentRemovePattern" | "commentTransformFn">,
  context: CommentTransformContext,
): string => {
  let result = comment;
  if (commentRemovePattern) {
    result = result.replace(commentRemovePattern, "");
  }
  if (commentTransformFn) {
    result = commentTransformFn(result, context);
  }
  return result;
};

const createFieldCommentString = (
  field: Field,
  model: Model,
  config: Pick<
    Config,
    | "ignoreCommentPattern"
    | "commentRemovePattern"
    | "commentTransformFn"
    | "includeEnumInFieldComment"
  >,
) => {
  if (
    config.ignoreCommentPattern &&
    field.documentation !== undefined &&
    config.ignoreCommentPattern.test(field.documentation)
  ) {
    return "";
  }

  let comment =
    field.documentation !== undefined
      ? applyCommentTransform(field.documentation, config, {
          type: "column",
          tableName: model.dbName,
          columnName: field.dbName,
          schema: model.schema,
        })
      : "";

  if (config.includeEnumInFieldComment && field.typeEnum) {
    if (comment !== "") {
      comment += "\n";
    }
    comment += `enum: ${field.typeEnum.dbName}(${field.typeEnum.values.join(", ")})`;
  }

  return comment;
};

const createModelCommentString = (
  model: Model,
  config: Pick<
    Config,
    "ignoreCommentPattern" | "commentRemovePattern" | "commentTransformFn"
  >,
): string => {
  if (
    model.documentation === undefined ||
    (config.ignoreCommentPattern &&
      config.ignoreCommentPattern.test(model.documentation))
  ) {
    return "";
  }

  return applyCommentTransform(model.documentation, config, {
    type: "table",
    tableName: model.dbName,
    schema: model.schema,
  });
};

export const diffComments = (first: Comments, second: Comments): Comments => {
  // first の中で、second と同じものは除外
  // first でコメントが空で、かつsecondに対応するものが無かった場合も除外
  // (空のコメントは、前回コメントが空じゃなかったときだけ入れるので)
  const diff: Comments = {};

  for (const key in first) {
    const tableDiff = diffTableComments(first[key], second[key]);
    if (tableDiff) {
      diff[key] = tableDiff;
    }
  }

  return diff;
};

const diffTableComments = (
  first: TableComments,
  second?: TableComments,
): TableComments | undefined => {
  const tableDiff = first.table
    ? diffComment(first.table, second?.table)
    : undefined;

  const commentDiffs = first.columns
    ?.map((firstColumn) => {
      // カラムが一致するものを探して比較
      const secondColumn = second?.columns?.find(
        (x) => x.columnName === firstColumn.columnName,
      );
      return diffComment(firstColumn, secondColumn);
    })
    .filter((x) => x !== undefined);

  if (!tableDiff && (!commentDiffs || commentDiffs.length === 0)) {
    return undefined;
  }

  return {
    table: tableDiff,
    columns: commentDiffs,
  };
};

const diffComment = <T extends TableComment | ColumnComment>(
  first: T,
  second?: T,
): T | undefined => {
  if (different(first.comment, second?.comment)) {
    return { ...first };
  }
  return undefined;
};

const different = (first: string, second?: string) => {
  return first !== (second ?? "");
};
