import { DMMF } from "@prisma/generator-helper";

export const parse = (datamodel: DMMF.Datamodel) => {
  const typeEnums = datamodel.enums.map((x) => parseEnum(x));
  const typeEnumMap = new Map(typeEnums.map((x) => [x.name, x]));
  const models = datamodel.models.map((x) => parseModel(x, typeEnumMap));

  return models;
};

const parseEnum = (datamodelEnum: DMMF.DatamodelEnum): TypeEnum => {
  return {
    dbName: datamodelEnum.dbName ?? datamodelEnum.name,
    name: datamodelEnum.name,
    values: datamodelEnum.values.map((x) => x.dbName ?? x.name),
    documentation: datamodelEnum.documentation,
  };
};

const parseField = (
  field: DMMF.Field,
  typeEnumMap: Map<string, TypeEnum>,
): Field => {
  const typeEnum =
    field.kind === "enum" ? typeEnumMap.get(field.type) : undefined;

  return {
    dbName: field.dbName ?? field.name,
    documentation: field.documentation,
    typeEnum,
  };
};

const parseModel = (
  model: DMMF.Model,
  typeEnumMap: Map<string, TypeEnum>,
): Model => {
  return {
    dbName: model.dbName ?? model.name,
    fields: model.fields
      .filter((x) => x.kind === "scalar" || x.kind === "enum")
      .map((x) => parseField(x, typeEnumMap)),
    documentation: model.documentation,
  };
};

export type Model = {
  dbName: string;
  fields: Field[];
  documentation?: string;
};

export type Field = {
  dbName: string;
  documentation?: string;
  typeEnum?: TypeEnum;
};

export type TypeEnum = {
  dbName: string;
  name: string;
  values: string[];
  documentation?: string;
};
