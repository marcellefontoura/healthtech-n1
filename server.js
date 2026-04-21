const express = require("express");
const cors = require("cors");
const { criarBanco } = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <body style="font-family: Arial; padding: 20px; line-height: 1.6;">
      <h1>HEALTHTECH</h1>
      <p>API desenvolvida para centralizar o cadastro de pacientes e o registro de atendimentos domiciliares.</p>

      <h3>Rotas disponíveis:</h3>
      <ul>
        <li> /pacientes</li>
        <li> /atendimentos</li>
      </ul>
    </body>
  `);
});

app.get("/pacientes", async (req, res) => {
  try {
    const db = await criarBanco();
    const pacientes = await db.all(`SELECT * FROM pacientes ORDER BY nome ASC`);
    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar pacientes." });
  }
});

app.get("/pacientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await criarBanco();
    const paciente = await db.get(`SELECT * FROM pacientes WHERE id = ?`, [id]);

    if (!paciente) {
      return res.status(404).json({ erro: "Paciente não encontrado." });
    }

    res.json(paciente);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar paciente." });
  }
});

app.post("/pacientes", async (req, res) => {
  try {
    const {
      nome,
      idade,
      endereco,
      contato_familiar,
      autonomia,
      observacoes_gerais,
    } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: "O campo nome é obrigatório." });
    }

    const db = await criarBanco();

    const resultado = await db.run(
      `
      INSERT INTO pacientes (
        nome,
        idade,
        endereco,
        contato_familiar,
        autonomia,
        observacoes_gerais
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        nome,
        idade,
        endereco,
        contato_familiar,
        autonomia,
        observacoes_gerais,
      ]
    );

    const novoPaciente = await db.get(`SELECT * FROM pacientes WHERE id = ?`, [
      resultado.lastID,
    ]);

    res.status(201).json({
      mensagem: "Paciente cadastrado com sucesso.",
      paciente: novoPaciente,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao cadastrar paciente." });
  }
});

app.put("/pacientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      idade,
      endereco,
      contato_familiar,
      autonomia,
      observacoes_gerais,
    } = req.body;

    const db = await criarBanco();
    const pacienteExistente = await db.get(`SELECT * FROM pacientes WHERE id = ?`, [id]);

    if (!pacienteExistente) {
      return res.status(404).json({ erro: "Paciente não encontrado." });
    }

    await db.run(
      `
      UPDATE pacientes
      SET nome = ?, idade = ?, endereco = ?, contato_familiar = ?, autonomia = ?, observacoes_gerais = ?
      WHERE id = ?
      `,
      [
        nome,
        idade,
        endereco,
        contato_familiar,
        autonomia,
        observacoes_gerais,
        id,
      ]
    );

    const pacienteAtualizado = await db.get(`SELECT * FROM pacientes WHERE id = ?`, [id]);

    res.json({
      mensagem: "Paciente atualizado com sucesso.",
      paciente: pacienteAtualizado,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar paciente." });
  }
});

app.delete("/pacientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await criarBanco();
    const pacienteExistente = await db.get(`SELECT * FROM pacientes WHERE id = ?`, [id]);

    if (!pacienteExistente) {
      return res.status(404).json({ erro: "Paciente não encontrado." });
    }

    await db.run(`DELETE FROM pacientes WHERE id = ?`, [id]);

    res.json({ mensagem: "Paciente removido com sucesso." });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao remover paciente." });
  }
});

app.get("/atendimentos", async (req, res) => {
  try {
    const db = await criarBanco();

    const atendimentos = await db.all(`
      SELECT
        atendimentos.*,
        pacientes.nome AS nome_paciente
      FROM atendimentos
      INNER JOIN pacientes ON pacientes.id = atendimentos.paciente_id
      ORDER BY data_atendimento DESC, horario DESC
    `);

    res.json(atendimentos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar atendimentos." });
  }
});

app.get("/atendimentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await criarBanco();

    const atendimento = await db.get(
      `
      SELECT
        atendimentos.*,
        pacientes.nome AS nome_paciente
      FROM atendimentos
      INNER JOIN pacientes ON pacientes.id = atendimentos.paciente_id
      WHERE atendimentos.id = ?
      `,
      [id]
    );

    if (!atendimento) {
      return res.status(404).json({ erro: "Atendimento não encontrado." });
    }

    res.json(atendimento);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar atendimento." });
  }
});

app.get("/pacientes/:id/atendimentos", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await criarBanco();

    const paciente = await db.get(`SELECT * FROM pacientes WHERE id = ?`, [id]);

    if (!paciente) {
      return res.status(404).json({ erro: "Paciente não encontrado." });
    }

    const historico = await db.all(
      `
      SELECT *
      FROM atendimentos
      WHERE paciente_id = ?
      ORDER BY data_atendimento DESC, horario DESC
      `,
      [id]
    );

    res.json({ paciente, historico });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar histórico do paciente." });
  }
});

app.post("/atendimentos", async (req, res) => {
  try {
    const {
      paciente_id,
      data_atendimento,
      horario,
      medicacao,
      alimentacao,
      sinais_vitais,
      observacoes,
      intercorrencias,
      resumo_para_familia,
    } = req.body;

    if (!paciente_id || !data_atendimento) {
      return res.status(400).json({
        erro: "Os campos paciente_id e data_atendimento são obrigatórios.",
      });
    }

    const db = await criarBanco();
    const paciente = await db.get(`SELECT * FROM pacientes WHERE id = ?`, [paciente_id]);

    if (!paciente) {
      return res.status(404).json({ erro: "Paciente não encontrado." });
    }

    const resultado = await db.run(
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
        paciente_id,
        data_atendimento,
        horario,
        medicacao,
        alimentacao,
        sinais_vitais,
        observacoes,
        intercorrencias,
        resumo_para_familia,
      ]
    );

    const novoAtendimento = await db.get(`SELECT * FROM atendimentos WHERE id = ?`, [
      resultado.lastID,
    ]);

    res.status(201).json({
      mensagem: "Atendimento registrado com sucesso.",
      atendimento: novoAtendimento,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao registrar atendimento." });
  }
});

app.put("/atendimentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paciente_id,
      data_atendimento,
      horario,
      medicacao,
      alimentacao,
      sinais_vitais,
      observacoes,
      intercorrencias,
      resumo_para_familia,
    } = req.body;

    const db = await criarBanco();
    const atendimentoExistente = await db.get(`SELECT * FROM atendimentos WHERE id = ?`, [id]);

    if (!atendimentoExistente) {
      return res.status(404).json({ erro: "Atendimento não encontrado." });
    }

    await db.run(
      `
      UPDATE atendimentos
      SET
        paciente_id = ?,
        data_atendimento = ?,
        horario = ?,
        medicacao = ?,
        alimentacao = ?,
        sinais_vitais = ?,
        observacoes = ?,
        intercorrencias = ?,
        resumo_para_familia = ?
      WHERE id = ?
      `,
      [
        paciente_id,
        data_atendimento,
        horario,
        medicacao,
        alimentacao,
        sinais_vitais,
        observacoes,
        intercorrencias,
        resumo_para_familia,
        id,
      ]
    );

    const atendimentoAtualizado = await db.get(`SELECT * FROM atendimentos WHERE id = ?`, [id]);

    res.json({
      mensagem: "Atendimento atualizado com sucesso.",
      atendimento: atendimentoAtualizado,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar atendimento." });
  }
});

app.delete("/atendimentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await criarBanco();
    const atendimentoExistente = await db.get(`SELECT * FROM atendimentos WHERE id = ?`, [id]);

    if (!atendimentoExistente) {
      return res.status(404).json({ erro: "Atendimento não encontrado." });
    }

    await db.run(`DELETE FROM atendimentos WHERE id = ?`, [id]);

    res.json({ mensagem: "Atendimento removido com sucesso." });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao remover atendimento." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
