import { opine } from "./deps.ts";
import indexRouter from './routes/index.ts';

const app = opine.opine();

app.use('/', indexRouter);

app.listen(3000);
