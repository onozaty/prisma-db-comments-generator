import { Comments } from "./comment";

const CREATE_COLUMN_COMMENT_STORED_PROCEDURES = `-- Stored procedure to update column comments
DROP PROCEDURE IF EXISTS prisma_update_column_comment;

CREATE PROCEDURE prisma_update_column_comment(
    IN p_table_name VARCHAR(255),
    IN p_column_name VARCHAR(255),
    IN p_comment_text TEXT
)
BEGIN
    DECLARE column_definition TEXT;
    
    -- Get current column definition from current database
    SELECT CONCAT(
        COLUMN_TYPE,
        CASE WHEN IS_NULLABLE = 'NO' THEN ' NOT NULL' ELSE ' NULL' END,
        CASE WHEN COLUMN_DEFAULT IS NOT NULL THEN CONCAT(' DEFAULT ', QUOTE(COLUMN_DEFAULT)) ELSE '' END,
        CASE WHEN EXTRA != '' THEN CONCAT(' ', EXTRA) ELSE '' END
    ) INTO column_definition
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = p_table_name
        AND COLUMN_NAME = p_column_name;
    
    -- Build and execute ALTER statement
    SET @sql = CONCAT(
        'ALTER TABLE \`', p_table_name, '\`',
        ' MODIFY COLUMN \`', p_column_name, '\` ',
        column_definition,
        CASE 
            WHEN p_comment_text IS NULL THEN ''
            ELSE CONCAT(' COMMENT ', QUOTE(p_comment_text))
        END
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;
`;

const DROP_COLUMN_COMMENT_STORED_PROCEDURES = `-- Drop stored procedure to update column comments
DROP PROCEDURE IF EXISTS prisma_update_column_comment;
`;

export const generateMySQLCommentStatements = (
  comments: Comments,
): string[] => {
  const commentStatements: string[] = [];
  let hasColumnComments = false;

  for (const tableName in comments) {
    const { table, columns } = comments[tableName];

    commentStatements.push(`-- ${tableName} comments`);
    if (table) {
      // Direct ALTER TABLE for table comment (MySQL doesn't support multi-schema)
      commentStatements.push(
        `ALTER TABLE \`${table.tableName}\` COMMENT = ${toStringLiteral(table.comment)};`,
      );
    }

    if (columns) {
      for (const column of columns) {
        // Call stored procedure for column comment (MySQL doesn't support multi-schema)
        commentStatements.push(
          `CALL prisma_update_column_comment(${toStringLiteral(column.tableName)}, ${toStringLiteral(column.columnName)}, ${toStringLiteral(column.comment)});`,
        );
        hasColumnComments = true;
      }
    }

    commentStatements.push("");
  }

  if (hasColumnComments) {
    // Add stored procedures first (only once)
    commentStatements.unshift(CREATE_COLUMN_COMMENT_STORED_PROCEDURES);

    // Drop stored procedures after use (cleanup)
    commentStatements.push(DROP_COLUMN_COMMENT_STORED_PROCEDURES);
  }

  return commentStatements;
};

const toStringLiteral = (str?: string) => {
  if (str) {
    return `'${escapeString(str)}'`;
  } else {
    return "NULL";
  }
};

const escapeString = (str: string) => {
  return str
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
};
