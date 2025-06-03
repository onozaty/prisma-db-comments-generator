import { DMMF } from "@prisma/generator-helper";
import { parse } from "./parser";

describe("parse", () => {
  test("returns empty array for empty datamodel", () => {
    // ARRANGE
    const datamodel: DMMF.Datamodel = {
      enums: [],
      models: [],
      types: [],
      indexes: [],
    };

    // ACT
    const result = parse(datamodel);

    // ASSERT
    expect(result).toEqual([]);
  });

  test("parses model with enum fields correctly", () => {
    // ARRANGE
    const datamodel: DMMF.Datamodel = {
      enums: [
        {
          name: "Role",
          dbName: "user_role",
          values: [
            { name: "ADMIN", dbName: "admin" },
            { name: "USER", dbName: "user" },
          ],
          documentation: "ユーザーロールを定義します",
        },
      ],
      models: [
        {
          name: "User",
          dbName: "users",
          primaryKey: null,
          schema: null,
          uniqueFields: [],
          uniqueIndexes: [],
          fields: [
            {
              name: "id",
              kind: "scalar",
              type: "Int",
              documentation: "ユーザーID",
              isRequired: true,
              isList: false,
              isUnique: true,
              isId: true,
              isReadOnly: false,
              hasDefaultValue: false,
            },
            {
              name: "role",
              kind: "enum",
              type: "Role",
              documentation: "ユーザーロール",
              isRequired: true,
              isList: false,
              isUnique: false,
              isId: false,
              isReadOnly: false,
              hasDefaultValue: false,
            },
          ],
          documentation: "ユーザーモデル",
        },
      ],
      types: [],
      indexes: [],
    };

    // ACT
    const result = parse(datamodel);

    // ASSERT
    expect(result).toEqual([
      {
        dbName: "users",
        fields: [
          {
            dbName: "id",
            documentation: "ユーザーID",
            typeEnum: undefined,
          },
          {
            dbName: "role",
            documentation: "ユーザーロール",
            typeEnum: {
              dbName: "user_role",
              name: "Role",
              values: ["admin", "user"],
              documentation: "ユーザーロールを定義します",
            },
          },
        ],
        documentation: "ユーザーモデル",
      },
    ]);
  });

  test("uses name as dbName when dbName is not specified", () => {
    // ARRANGE
    const datamodel: DMMF.Datamodel = {
      enums: [
        {
          name: "Status",
          values: [
            { name: "ACTIVE", dbName: "ACTIVE" },
            { name: "INACTIVE", dbName: "INACTIVE" },
          ],
        },
      ],
      models: [
        {
          name: "Post",
          dbName: "Post",
          primaryKey: null,
          schema: null,
          uniqueFields: [],
          uniqueIndexes: [],
          fields: [
            {
              name: "title",
              kind: "scalar",
              type: "String",
              isRequired: true,
              isList: false,
              isUnique: false,
              isId: false,
              isReadOnly: false,
              hasDefaultValue: false,
            },
            {
              name: "status",
              kind: "enum",
              type: "Status",
              isRequired: true,
              isList: false,
              isUnique: false,
              isId: false,
              isReadOnly: false,
              hasDefaultValue: false,
            },
          ],
        },
      ],
      types: [],
      indexes: [],
    };

    // ACT
    const result = parse(datamodel);

    // ASSERT
    expect(result).toEqual([
      {
        dbName: "Post",
        fields: [
          {
            dbName: "title",
            documentation: undefined,
            typeEnum: undefined,
          },
          {
            dbName: "status",
            documentation: undefined,
            typeEnum: {
              dbName: "Status",
              name: "Status",
              values: ["ACTIVE", "INACTIVE"],
              documentation: undefined,
            },
          },
        ],
        documentation: undefined,
      },
    ]);
  });
});
