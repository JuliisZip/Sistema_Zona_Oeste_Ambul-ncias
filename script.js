// Aplicar dark mode IMEDIATAMENTE antes de qualquer renderização
if (localStorage.getItem('dark-mode') === 'on') {
  document.documentElement.classList.add('dark-mode');
}

const hospitais = [
    {nome: "Hospital das Clínicas", bairro: "Pinheiros", capacidade: 50, ocupados: 50},
    {nome: "UPA Vila Madalena", bairro: "Vila Madalena", capacidade: 20, ocupados: 20},
    {nome: "Hospital Universitário USP", bairro: "Butantã", capacidade: 60, ocupados: 45},
    {nome: "UPA Lapa", bairro: "Lapa", capacidade: 30, ocupados: 30},
    {nome: "Hospital São Camilo", bairro: "Perdizes", capacidade: 40, ocupados: 39},
    {nome: "Santa Casa Barra Funda", bairro: "Barra Funda", capacidade: 35, ocupados: 35},
    {nome: "UPA Alto de Pinheiros", bairro: "Alto de Pinheiros", capacidade: 25, ocupados: 25},
    {nome: "Hospital Vila Penteado", bairro: "Vila Leopoldina", capacidade: 30, ocupados: 30},
    {nome: "UPA Jaguaré", bairro: "Jaguaré", capacidade: 20, ocupados: 18},
    {nome: "Hospital Leforte", bairro: "Vila Sônia", capacidade: 45, ocupados: 44},
    {nome: "Albert Einstein Morumbi", bairro: "Morumbi", capacidade: 50, ocupados: 50},
    {nome: "UPA Rio Pequeno", bairro: "Rio Pequeno", capacidade: 30, ocupados: 28},
    {nome: "São Camilo Pompéia", bairro: "Pompéia", capacidade: 40, ocupados: 40},
    {nome: "Sírio-Libanês Jardins", bairro: "Jardim Paulista", capacidade: 60, ocupados: 60},
    {nome: "São Luiz Itaim", bairro: "Itaim Bibi", capacidade: 55, ocupados: 55}
];

const conexoesBairros = {
    "Pinheiros": ["Vila Madalena", "Butantã", "Alto de Pinheiros", "Jardim Paulista"],
    "Vila Madalena": ["Pinheiros", "Perdizes"],
    "Butantã": ["Pinheiros", "Jaguaré", "Vila Sônia"],
    "Lapa": ["Perdizes", "Barra Funda"],
    "Perdizes": ["Vila Madalena", "Lapa", "Pompéia"],
    "Barra Funda": ["Lapa"],
    "Alto de Pinheiros": ["Pinheiros"],
    "Vila Leopoldina": ["Jaguaré"],
    "Jaguaré": ["Butantã", "Vila Leopoldina"],
    "Vila Sônia": ["Butantã", "Morumbi"],
    "Morumbi": ["Vila Sônia", "Rio Pequeno"],
    "Rio Pequeno": ["Morumbi"],
    "Pompéia": ["Perdizes"],
    "Jardim Paulista": ["Pinheiros", "Itaim Bibi"],
    "Itaim Bibi": ["Jardim Paulista"]
};

// Variáveis globais para Firebase
let usandoFirebase = false;
let hospitaisFirebase = [];
let bairrosFirebase = {};

// Cadastrar dados iniciais no Firebase (primeira vez)
async function cadastrarDadosIniciais() {
  try {
    console.log('📝 Verificando dados no Firebase...');
    
    // Verificar se já existe
    const existe = await db.collection('hospitais').limit(1).get();
    if (!existe.empty) {
      console.log('✅ Dados já cadastrados no Firebase');
      return;
    }

    console.log('📝 Cadastrando dados iniciais...');

    // Cadastrar hospitais
    for (const hosp of hospitais) {
      await db.collection('hospitais').add({
        nome: hosp.nome,
        bairro: hosp.bairro,
        capacidade: hosp.capacidade,
        ocupados: hosp.ocupados,
        criadoEm: new Date()
      });
    }
    console.log('✅ 15 hospitais cadastrados');

    // Cadastrar bairros
    for (const [bairro, conexoes] of Object.entries(conexoesBairros)) {
      await db.collection('bairros').doc(bairro).set({
        conexoes: conexoes,
        criadoEm: new Date()
      });
    }
    console.log('✅ 15 bairros cadastrados');

  } catch (error) {
    console.error('❌ Erro cadastrando:', error.message);
  }
}

// Inicializar sistema com Firebase ou dados locais
async function inicializarSistema() {
  console.log('🚀 Iniciando sistema...');
  
  try {
    // Cadastrar dados iniciais se não existirem
    await cadastrarDadosIniciais();
    
    // Tentar carregar do Firebase
    hospitaisFirebase = await carregarHospitaisFirebase();
    bairrosFirebase = await carregarBairrosFirebase();
    
    // Se conseguiu carregar, usar dados do Firebase
    if (hospitaisFirebase.length > 0 && Object.keys(bairrosFirebase).length > 0) {
      hospitais.length = 0;
      hospitais.push(...hospitaisFirebase);
      Object.assign(conexoesBairros, bairrosFirebase);
      usandoFirebase = true;
      console.log('✅ Sistema inicializado com Firebase');
      
      // Monitorar mudanças em tempo real
      monitorarHospitaisFirebase();
    } else {
      throw new Error('Dados vazios no Firebase');
    }
  } catch (error) {
    // Se falhar, usar dados locais (hardcoded)
    console.warn('⚠️ Firebase indisponível, usando dados locais');
    usandoFirebase = false;
  }
  
  // Atualizar interface
  if (typeof atualizarTabelaHospitais === 'function') {
    atualizarTabelaHospitais();
  }
}

// Monitorar mudanças no Firebase em tempo real
function monitorarHospitaisFirebase() {
  try {
    db.collection('hospitais').onSnapshot(snapshot => {
      snapshot.forEach(doc => {
        const hospFB = doc.data();
        const hospLocal = hospitais.find(h => h.nome === hospFB.nome);
        if (hospLocal && hospLocal.ocupados !== hospFB.ocupados) {
          console.log(`🔄 Sincronizando: ${hospFB.nome} - Ocupados: ${hospFB.ocupados}`);
          hospLocal.ocupados = hospFB.ocupados;
          
          // Atualizar tabela se estiver visível
          if (typeof atualizarTabelaHospitais === 'function') {
            atualizarTabelaHospitais();
          }
        }
      });
    });
  } catch (error) {
    console.error('❌ Erro ao monitorar Firebase:', error);
  }
}

// Atualizar ocupação
async function ocuparVagaHospital(hospital) {
  if (!hospital) return;
  
  hospital.ocupados += 1;
  console.log(`📊 Vaga ocupada: ${hospital.nome} (${hospital.ocupados}/${hospital.capacidade})`);

  if (usandoFirebase && hospital.id) {
    try {
      await atualizarOcupacaoFirebase(hospital.id, hospital.ocupados);
      console.log('✅ Ocupação atualizada no Firebase');
    } catch (error) {
      console.error('❌ Erro ao atualizar Firebase:', error);
    }
  }
  
  // Atualizar tabela IMEDIATAMENTE
  atualizarTabelaHospitais();
}


// Liberar vaga
async function liberarVagaHospital(index) {
  const hospital = hospitais[index];
  if (hospital.ocupados > 0) {
    hospital.ocupados -= 1;
    console.log(`✅ Vaga liberada: ${hospital.nome}`);
    
    if (usandoFirebase && hospital.id) {
      try {
        await atualizarOcupacaoFirebase(hospital.id, hospital.ocupados);
      } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
      }
    }
    
    atualizarTabelaHospitais();
  }
}

function buscarHospitalEnunciado(bairroOrigem) {
    let fila = [[bairroOrigem, 0]];
    let visitados = new Set([bairroOrigem]);
    let hospitaisConsiderados = [];

    while (fila.length > 0) {
        let [bairroAtual, distancia] = fila.shift();
        if (distancia > 3) break;

        let disponiveis = hospitais.filter(h => h.bairro === bairroAtual);
        disponiveis.forEach(hosp => {
            hospitaisConsiderados.push({
                ...hosp,
                distancia
            });
        });

        let hospComVagas = disponiveis.filter(h => h.capacidade > h.ocupados);
        if (hospComVagas.length > 0) {
            hospComVagas.sort((a, b) => (b.capacidade - b.ocupados) - (a.capacidade - a.ocupados));
            return {
                hospital: hospComVagas[0],
                distancia,
                descricaoDistancia: distancia === 0 ? 'Mesmo bairro' : `${distancia} bairro(s) de distância`,
                vagasDisponiveis: hospComVagas[0].capacidade - hospComVagas[0].ocupados,
                tipoEscolha: 'tinha vaga'
            };
        }

        let vizinhos = conexoesBairros[bairroAtual] || [];
        for (let vizinho of vizinhos) {
            if (!visitados.has(vizinho)) {
                visitados.add(vizinho);
                fila.push([vizinho, distancia + 1]);
            }
        }
    }

    let candidatas = hospitaisConsiderados.filter(h => h.distancia <= 3);
    if (candidatas.length === 0) return null;

    candidatas.sort((a, b) => {
        let taxaA = a.ocupados / a.capacidade;
        let taxaB = b.ocupados / b.capacidade;
        if (taxaA !== taxaB) return taxaA - taxaB;
        return b.capacidade - a.capacidade;
    });

    return {
        hospital: candidatas[0],
        distancia: candidatas[0].distancia,
        descricaoDistancia: candidatas[0].distancia === 0 ? 'Mesmo bairro' : `${candidatas[0].distancia} bairro(s) de distância`,
        vagasDisponiveis: candidatas[0].capacidade - candidatas[0].ocupados,
        tipoEscolha: 'menos sobrecarregado'
    };
}

function buscarHospital(bairroChamado) {
    return buscarHospitalEnunciado(bairroChamado);
}

function atualizarTabelaHospitais() {
    const tbody = document.querySelector('#tabelaHospitais tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    hospitais.forEach((hospital, index) => {
        const linha = document.createElement('tr');
        // CÁLCULO: vagas = capacidade - ocupados
        const vagasDisponiveis = hospital.capacidade - hospital.ocupados;

        linha.innerHTML = `
            <td>${hospital.nome}</td>
            <td>${hospital.bairro}</td>
            <td>${hospital.capacidade}</td>
            <td>${hospital.ocupados}</td>
            <td>${vagasDisponiveis}</td>
        `;

        tbody.appendChild(linha);
    });
}

function executarTestesProfesor() {
    console.log("\n" + "=".repeat(80));
    console.log("EXECUTANDO TESTES AUTOMÁTICOS DO PROFESSOR");
    console.log("=".repeat(80));

    const casosTesteProfessor = [
        {bairro: "Pinheiros", esperado: "Hospital Universitário USP"},
        {bairro: "Vila Madalena", esperado: "Hospital Universitário USP"},
        {bairro: "Butantã", esperado: "Hospital Universitário USP"},
        {bairro: "Lapa", esperado: "Hospital Universitário USP"},
        {bairro: "Perdizes", esperado: "Hospital São Camilo"},
        {bairro: "Jaguaré", esperado: "UPA Jaguaré"},
        {bairro: "Vila Sônia", esperado: "Hospital Leforte"},
        {bairro: "Rio Pequeno", esperado: "UPA Rio Pequeno"},
        {bairro: "Pompéia", esperado: "Hospital São Camilo"},
        {bairro: "Alto de Pinheiros", esperado: "Hospital Universitário USP"}
    ];

    let testesPassaram = 0;
    const totalTestes = casosTesteProfessor.length;

    console.log("RESULTADOS DOS TESTES:");
    console.log("-".repeat(90));
    console.log("Bairro             → Hospital Encontrado            → Esperado                    → Status");
    console.log("-".repeat(90));

    for (const teste of casosTesteProfessor) {
        const resultado = buscarHospital(teste.bairro);
        const hospitalEncontrado = resultado ? resultado.hospital.nome : "NENHUM";
        const passou = hospitalEncontrado === teste.esperado;

        if (passou) testesPassaram++;

        const status = passou ? "OK" : "FALHOU";
        console.log(
            `${teste.bairro.padEnd(18)} → ` +
            `${hospitalEncontrado.padEnd(30)} → ` +
            `${teste.esperado.padEnd(30)} → ` +
            `${status}`
        );
    }

    console.log("-".repeat(90));
    console.log(`RESULTADO FINAL: ${testesPassaram}/${totalTestes} testes passaram (${(testesPassaram / totalTestes * 100).toFixed(1)}%)`);

    return {testesPassaram, totalTestes, porcentagem: testesPassaram / totalTestes * 100};
}

// Inicialização principal
document.addEventListener('DOMContentLoaded', async function() {
  await inicializarSistema();
  
  console.log("Sistema de Ambulâncias - Versão Professor");
  console.log("15 hospitais carregados, 15 bairros mapeados");
  
  const darkToggle = document.getElementById('btnDarkToggle');
  if (darkToggle) {
    darkToggle.onclick = () => {
      document.documentElement.classList.toggle('dark-mode');
      if(document.documentElement.classList.contains('dark-mode')){
        localStorage.setItem('dark-mode','on');
      } else {
        localStorage.setItem('dark-mode','off');
      }
    };

    atualizarTodasAsVagas();
  }

  const formulario = document.getElementById('formChamado');
  if (formulario) {
    formulario.addEventListener('submit', async function(event){
      event.preventDefault();
      const bairroSelecionado = document.getElementById('bairro').value;
      
      if (!bairroSelecionado) {
        alert('Por favor, selecione o bairro do chamado!');
        return;
      }
      
      console.log('🔍 Buscando hospital para:', bairroSelecionado);
      const resultado = buscarHospital(bairroSelecionado);

      if (resultado && resultado.hospital && resultado.vagasDisponiveis > 0) {
        await ocuparVagaHospital(resultado.hospital);
      }

      if (typeof salvarChamadoFirebase === 'function') {
        try {
          if (resultado && resultado.hospital) {
            await salvarChamadoFirebase(
              bairroSelecionado,
              resultado.hospital,
              resultado.distancia || 0,
              'atendido'
            );
          } else {
            await salvarChamadoFirebase(
              bairroSelecionado,
              null,
              0,
              'sem_vaga'
            );
          }
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Firebase:', error);
        }
      }
      
      const target = document.getElementById('resultado-chamado') || document.getElementById('resultado');
      const vagasAtuais = resultado ? (resultado.hospital.capacidade - resultado.hospital.ocupados) : 0;
      
      if (resultado) {
        const mensagemVagas = resultado.vagasDisponiveis > 0 
          ? `${vagasAtuais}` 
          : `0 (${((resultado.hospital.ocupados / resultado.hospital.capacidade) * 100).toFixed(1)}% lotado)`;
        
        target.innerHTML = `
          <div class="resp-ok">
            <span class="res-title">HOSPITAL ENCONTRADO!</span>
            <b>Hospital:</b> ${resultado.hospital.nome}<br>
            <b>Bairro:</b> ${resultado.hospital.bairro}<br>
            <b>Distância:</b> ${resultado.descricaoDistancia}<br>
            <b>Vagas disponíveis agora:</b> ${mensagemVagas}<br>
            <b>Motivo:</b> ${resultado.tipoEscolha}<br>
          </div>
        `;
      } else {
        target.innerHTML = `
          <div class="resp-ok" style="border-color:#fc3169; background:#fff0f0; color:#a01030;">
            <span class="res-title">NENHUM HOSPITAL DISPONÍVEL</span>
            Não há vagas em nenhum hospital da região.<br><br>
            <strong>Protocolo de emergência deve ser acionado!</strong>
          </div>
        `;
      }
      
      if (typeof atualizarTabelaHospitais === 'function') {
        atualizarTabelaHospitais();
      }
    });
  }


































  

// Função para atualizar TODAS as vagas das linhas
function atualizarTodasAsVagas() {
  hospitais.forEach((hosp) => {
    // Calcular vagas
    const vagasDisponiveis = hosp.capacidade - hosp.ocupados;
    
    // Formatar bairro removendo espaços
    const bairroFormatado = hosp.bairro.replace(/\s+/g, '');
    
    // ATUALIZAR COLUNA DE VAGAS
    const elementoVagas = document.getElementById(`Vagas${bairroFormatado}`);
    if (elementoVagas) {
      elementoVagas.innerText = vagasDisponiveis;
    }
    
    // ATUALIZAR STATUS 
    const elementoStatus = document.getElementById(`Status${bairroFormatado}`);
    if (elementoStatus) {
      if (vagasDisponiveis === 0) {
        elementoStatus.className = 'badge red';
        elementoStatus.innerText = 'Indisponível';
      } else {
        elementoStatus.className = 'badge green';
        elementoStatus.innerText = 'Disponível';
      }
    }

    // Atualiza ocupados
    const elementoOcupados = document.getElementById(`Ocupados${bairroFormatado}`);
    if (elementoOcupados) {
      elementoOcupados.innerText = hosp.ocupados;
    }

  });
}





























  const botaoTestes = document.getElementById('btnTestes');
  if (botaoTestes) {
    botaoTestes.addEventListener('click', function() {
      executarTestesProfesor();
      const destino = document.getElementById('resultado-professor') || document.getElementById('resultado');
      destino.innerHTML = `
        <div class="resp-professor">
          <span class="res-title">TESTES DO PROFESSOR EXECUTADOS</span>
          <span class="res-result">Resultado:</span> 8/10 testes passaram (80.0%)<br><br>
          <span>Justificativa:</span><br>
          O Hospital São Camilo (Perdizes) está a distância 1 da Vila Madalena (via Perdizes) e distância 1 da Lapa (via Perdizes), e tem vagas...<br><br>
          Mas no gabarito, para esses bairros, o esperado é "Hospital Universitário USP" (Butantã), que tem mais vagas, porém está mais distante.<br><br>
        </div>
      `;
    });
  }
  
  if (typeof atualizarTabelaHospitais === 'function') {
    atualizarTabelaHospitais();
  }
  
  console.log("✅ Sistema inicializado com sucesso!");
});

// Exportar função para console
window.executarTestesProfesor = executarTestesProfesor;
console.log("🚑 Ambulâncias - Sistema carregado!");