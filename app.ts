import { opine } from "opine";
import indexRouter from "./routes/index.ts";

const app = opine();
app.use("/", indexRouter);
app.listen(3000, () => console.log(`The server is running on port ${3000}`));
