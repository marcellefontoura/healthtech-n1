const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const criarBanco = async () => {
  const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });

  await db.exec(`PRAGMA foreign_keys = ON;`);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      idade INTEGER,
      endereco TEXT,
      contato_familiar TEXT,
      autonomia TEXT,
      observacoes_gerais TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS atendimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      data_atendimento TEXT NOT NULL,
      horario TEXT,
      medicacao TEXT,
      alimentacao TEXT,
      sinais_vitais TEXT,
      observacoes TEXT,
      intercorrencias TEXT,
      resumo_para_familia TEXT,
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
    );
  `);

  const totalPacientes = await db.get(`SELECT COUNT(*) AS total FROM pacientes`);

  if (totalPacientes.total === 0) {
    await db.run(
      `
      INSERT INTO pacientes (
        nome, idade, endereco, contato_familiar, autonomia, observacoes_gerais
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        "Maria da Silva",
        78,
        "Rua das Acácias, 120 - Centro",
        "Ana Silva - (21) 99999-9999",
        "Parcial",
        "Paciente com hipertensão e dificuldade de locomoção.",
      ]
    );

    await db.run(
      `
      INSERT INTO pacientes (
        nome, idade, endereco, contato_familiar, autonomia, observacoes_gerais
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        "José Pereira",
        84,
        "Av. Brasil, 455 - Bairro Novo",
        "Carlos Pereira - (21) 98888-7777",
        "Baixa",
        "Necessita de auxílio para banho, alimentação e medicação.",
      ]
    );

    await db.run(
      `
      INSERT INTO atendimentos (
        paciente_id,
        data_atendimento,
        horario,
        medicacao,
        alimentacao,
        sinais_vitais,
        observacoes,
        intercorrencias,
        resumo_para_familia
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        1,
        "2026-04-21",
        "09:00",
        "Losartana 50mg administrada às 09:10",
        "Café da manhã realizado normalmente",
        "PA 13x8, temperatura 36.5",
        "Paciente calma e colaborativa durante o atendimento.",
        "Sem intercorrências",
        "Atendimento realizado sem alterações importantes.",
      ]
    );
  }

  return db;
};

module.exports = { criarBanco };
