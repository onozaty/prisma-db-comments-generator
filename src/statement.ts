import { Comments } from "./comment";

export const generateCommentStatements = (comments: Comments): string[] => {
  const commentStatements: string[] = [];

  for (const tableName in comments) {
    const { table, columns } = comments[tableName];

    commentStatements.push(`-- ${tableName} comments`);
    if (table) {
      // ON TABLE
      commentStatements.push(
        `COMMENT ON TABLE ${joinNames(table.schema, table.tableName)} IS ${commentValue(table.comment)};`,
      );
    }

    if (columns) {
      for (const column of columns) {
        // ON COLUMN
        commentStatements.push(
          `COMMENT ON COLUMN ${joinNames(column.schema, column.tableName, column.columnName)} IS ${commentValue(column.comment)};`,
        );
      }
    }

    commentStatements.push("");
  }

  return commentStatements;
};

const commentValue = (comment?: string) => {
  if (comment) {
    const commentValue = `'${escapeComment(comment)}'`;
    return commentValue.includes("\\") ? "E" + commentValue : commentValue;
  } else {
    return "NULL";
  }
};

const escapeComment = (comment: string) => {
  return comment.replace(/'/g, "''").replace(/\n/g, "\\n");
};

const joinNames = (
  schema: string | undefined,
  tableName: string,
  columnName?: string,
) => {
  let name = "";
  if (schema) {
    name += `"${schema}".`;
  }
  name += `"${tableName}"`;
  if (columnName) {
    name += `."${columnName}"`;
  }
  return name;
};
