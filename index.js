import { config } from "dotenv";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

config();
const app = express();

app.use(cors()); // Use this after the variable declaration

app.set("port", process.env.PORT || 3000);
var server = app.listen(app.get("port"), function () {
  console.log("Express server listening on port " + server.address().port);
});

// models
import { User } from "./models/User.js";

// Config JSON response
app.use(express.json());

// Open Route
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem vindo a API!" });
});

// Open Route
app.post("/services", async (req, res) => {
  const { serviceOng } = req.body;

  // check if user exists
  const user = await User.find({
    service: { $regex: serviceOng, $options: "i" },
    isOng: true,
  });

  if (!user) {
    return res.status(404).json({ msg: "Serviço não encontrado!" });
  }

  res.status(200).json({ user });
});

// Private Route
app.get("/user/:id", checkToken, async (req, res) => {
  const id = req.params.id;

  // check if user exists
  const user = await User.findById(id, "-password");

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  res.status(200).json({ user });
});

app.post("/user", async (req, res) => {
  const _id = req.body;

  // check if user exists
  const user = await User.findById(_id);

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  res.status(200).json({ user });
});

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ msg: "Acesso negado!" });

  try {
    const secret = process.env.SECRET;

    jwt.verify(token, secret);

    next();
  } catch (err) {
    res.status(400).json({ msg: "O Token é inválido!" });
  }
}

app.post("/auth/register", async (req, res) => {
  const {
    name,
    email,
    password,
    confirmpassword,
    isOng,
    service,
    address,
    location,
  } = req.body;

  // validations
  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório!" });
  }

  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!service && isOng) {
    return res.status(422).json({ msg: "O serviço é obrigatório!" });
  }

  if (!address) {
    return res.status(422).json({ msg: "Endereço é obrigatório!" });
  }

  if (!location) {
    return res.status(422).json({ msg: "Localização no MAPA é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  if (password != confirmpassword) {
    return res
      .status(422)
      .json({ msg: "A senha e a confirmação precisam ser iguais!" });
  }

  // check if user exists
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
  }

  // create password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // create user
  const user = new User({
    name,
    email,
    service,
    password: passwordHash,
    isOng,
    address,
    location,
  });

  try {
    await user.save();

    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // validations
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  // check if user exists
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  // check if password match
  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha inválida" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res
      .status(200)
      .json({ msg: "Autenticação realizada com sucesso!", token, user });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.jf6ig3o.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Conectou ao banco!");
    app.listen(3002);
  })
  .catch((err) => console.log(err));
