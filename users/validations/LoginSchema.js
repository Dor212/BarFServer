import joi from "joi";

const LoginSchema = joi.object({
  email: joi
    .string()
    .email({ tlds: { allow: false } })
    .required(),
  password: joi
    .string()
    .pattern(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*\-]).{9,64}$/)
    .required()
    .messages({
      "string.pattern.base":
        "password must be at least nine characters long and contain an uppercase letter, a lowercase letter, a number and one of the following characters !@#$%^&*-",
    }),
  rememberMe: joi.boolean().optional().default(false),
});

export default LoginSchema;
