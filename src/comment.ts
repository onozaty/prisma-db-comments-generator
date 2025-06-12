import { Config } from "./config";
import { Field, Model } from "./parser";

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
    includeEnumInFieldComment,
  }: Pick<
    Config,
    | "targets"
    | "ignorePattern"
    | "ignoreCommentPattern"
    | "includeEnumInFieldComment"
  >,
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
            comment: createModelCommentString(model, ignoreCommentPattern),
          }
        : undefined,
      columns: targets.includes("column")
        ? model.fields.map((field) => {
            return {
              schema: model.schema,
              tableName: model.dbName,
              columnName: field.dbName,
              comment: createFieldCommentString(
                field,
                ignoreCommentPattern,
                includeEnumInFieldComment,
              ),
            };
          })
        : undefined,
    };
  }

  return comments;
};

const createFieldCommentString = (
  field: Field,
  ignoreCommentPattern: RegExp | undefined,
  includeEnumInFieldComment: boolean,
) => {
  let comment = field.documentation ?? "";

  if (ignoreCommentPattern && ignoreCommentPattern.test(comment)) {
    return "";
  }

  if (includeEnumInFieldComment && field.typeEnum) {
    if (comment !== "") {
      comment += "\n";
    }
    comment += `enum: ${field.typeEnum.dbName}(${field.typeEnum.values.join(", ")})`;
  }

  return comment;
};

const createModelCommentString = (
  model: Model,
  ignoreCommentPattern: RegExp | undefined,
): string => {
  if (model.documentation === undefined) {
    return "";
  }

  if (ignoreCommentPattern && ignoreCommentPattern.test(model.documentation)) {
    return "";
  }

  return model.documentation;
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
