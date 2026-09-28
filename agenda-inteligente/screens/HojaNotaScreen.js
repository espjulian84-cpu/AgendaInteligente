import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HojaNotaScreen({ notaInicial = '', alGuardarNota }) {
  const [textoNota, setTextoNota] = useState(notaInicial);
  const [datosBase, setDatosBase] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [cursorPos, setCursorPos] = useState(0);

  useEffect(() => {
    cargarBaseDatos();
  }, []);

  const cargarBaseDatos = async () => {
    try {
      const bdGuardada = await AsyncStorage.getItem('base_datos_maestra');
      if (bdGuardada !== null) {
        setDatosBase(JSON.parse(bdGuardada));
      } else {
        setDatosBase([]);
      }
    } catch (error) {
      console.log('Error leyendo la base maestra:', error);
    }
  };

  const manejarEscritura = (texto) => {
    setTextoNota(texto);

    // Buscamos las últimas palabras escritas para filtrar
    const palabras = texto.split(' ');
    const ultimaPalabra = palabras[palabras.length - 1].trim();

    if (ultimaLineaValida(ultimaPalabra)) {
      const filtradas = datosBase.filter(item => 
        item.toLowerCase().includes(ultimaPalabra.toLowerCase())
      );
      setSugerencias(filtradas);
    } else {
      setSugerencias([]);
    }
  };

  const ultimaLineaValida = (palabra) => {
    return palabra.length >= 3;
  };

  // Inserción limpia sin perder el control del texto
  const seleccionarSugerencia = (textoElegido) => {
    const palabras = textoNota.split(' ');
    palabras[palabras.length - 1] = textoElegido + ' ';
    const nuevoTexto = palabras.join(' ');
    
    setTextoNota(nuevoTexto);
    setSugerencias([]);
  };

  return (
    <SafeAreaView style={styles.contenedorPrincipal}>
      <View style={styles.contenedor}>
        
        <View style={styles.cabecera}>
          <Text style={styles.titulo}>Folio de Notas</Text>
          <TouchableOpacity style={styles.botonGuardarMini} onPress={() => alGuardarNota(textoNota)}>
            <Text style={styles.textoBotonGuardار}>💾 Guardar Hoja</Text>
          </TouchableOpacity>
        </View>

        {/* Panel de sugerencias estático superior que no interfiere con el teclado */}
        {sugerencias.length > 0 && (
          <View style={styles.panelSugerencias}>
            <ScrollView style={{ maxHeight: 110 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              {sugerencias.map((sug, i) => (
                <TouchableOpacity key={i} style={styles.itemSugerencia} onPress={() => seleccionarSugerencia(sug)}>
                  <Text style={styles.textoSugerencia}>🔍 {sug}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.cajaAlargadaContenedor}>
          <TextInput 
            style={[styles.inputAlargado, { flex: 1, textAlignVertical: 'top' }]}
            placeholder="Escribe notas, materiales..."
            placeholderTextColor="#94a3b8"
            multiline={true}
            value={textoNota}
            onFocus={cargarBaseDatos}
            onChangeText={manejarEscritura}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: '#f8fafc' },
  contenedor: { flex: 1, padding: 15 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  
  panelSugerencias: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 8, padding: 8, marginBottom: 10, elevation: 3 },
  itemSugerencia: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#fde68a' },
  textoSugerencia: { fontSize: 15, color: '#92400e', fontWeight: 'bold' },

  cajaAlargadaContenedor: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 15, elevation: 2 },
  inputAlargado: { fontSize: 16, color: '#1e293b' },
  
  botonGuardarMini: { backgroundColor: '#bbf7d0', height: 40, paddingHorizontal: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 5, borderWidth: 1, borderColor: '#86efac', elevation: 1 },
  textoBotonGuardar: { color: '#166534', fontSize: 15, fontWeight: 'bold' }
});