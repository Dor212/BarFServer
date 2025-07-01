import chalk from "chalk";

export const ErrorHandler = (err, req, res, next) => {
  console.log(chalk.red("❌ SERVER ERROR:"), err.message);

  const status = err.status || 500;
  const message = err.message || "Something went wrong";

  res.status(status).json({ error: message });
};
