// Carregar hospitais do Firestore
async function carregarHospitaisFirebase() {
  try {
    const hospitaisRef = db.collection('hospitais');
    const snapshot = await hospitaisRef.get();
    
    const hospitaisArray = [];
    snapshot.forEach(doc => {
      hospitaisArray.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${hospitaisArray.length} hospitais carregados do Firebase`);
    return hospitaisArray;
  } catch (error) {
    console.error('❌ Erro ao carregar hospitais:', error);
    throw error;
  }
}

// Carregar bairros do Firestore
async function carregarBairrosFirebase() {
  try {
    const bairrosRef = db.collection('bairros');
    const snapshot = await bairrosRef.get();
    
    const bairrosObj = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      bairrosObj[data.nome] = data.adjacentes || [];
    });
    
    console.log(`✅ ${Object.keys(bairrosObj).length} bairros carregados do Firebase`);
    return bairrosObj;
  } catch (error) {
    console.error('❌ Erro ao carregar bairros:', error);
    throw error;
  }
}

// Salvar chamado no Firestore (histórico)
async function salvarChamadoFirebase(bairro, hospital, distancia, status = 'atendido') {
  try {
    const chamadoRef = await db.collection('chamados').add({
      bairro: bairro,
      hospitalNome: hospital ? hospital.nome : 'Nenhum',
      hospitalBairro: hospital ? hospital.bairro : 'N/A',
      distancia: distancia,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: status,
      vagasDisponiveis: hospital ? (hospital.capacidade - hospital.ocupados) : 0
    });
    
    console.log(`✅ Chamado salvo no Firebase (ID: ${chamadoRef.id})`);
    return chamadoRef.id;
  } catch (error) {
    console.error('❌ Erro ao salvar chamado:', error);
  }
}

// Atualizar ocupação de hospital
async function atualizarOcupacaoFirebase(hospitalId, novaOcupacao) {
  try {
    await db.collection('hospitais').doc(hospitalId).update({
      ocupados: novaOcupacao
    });
    console.log(`✅ Ocupação atualizada para ${novaOcupacao}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar ocupação:', error);
  }
}

// Buscar histórico de chamados
async function buscarHistoricoChamados(limite = 10) {
  try {
    const chamadosRef = db.collection('chamados')
      .orderBy('timestamp', 'desc')
      .limit(limite);
    
    const snapshot = await chamadosRef.get();
    const historico = [];
    
    snapshot.forEach(doc => {
      historico.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${historico.length} chamados carregados do histórico`);
    return historico;
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    return [];
  }
}