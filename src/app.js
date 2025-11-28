import express from "express";

import path from "path";
import cookieParser from "cookie-parser";
import { globalLimiter } from "./middleware/rateLimited.js";

// Importar rotas
import pageRoutes from "./routes/pageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();

// Middlewares
//app.use(globalLimiter);
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Arquivos estáticos
app.use(express.static(path.join(import.meta.dirname, "../public")));

// Rotas
app.use("/", pageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

export default app;