import DataUriParser from "datauri/parser.js";
import path from "path";

const parser = new DataUriParser();

const getDataUri = (file) =>
  parser.format(path.extname(file.originalname).toString(), file.buffer);

export default getDataUri;
