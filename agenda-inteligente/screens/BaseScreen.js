import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BaseScreen({ datos = [], alAgregar, alEliminar }) {
  const [nuevoDato, setNuevoDato] = useState('');

  const manejarAgregar = () => {
    if (nuevoDato.trim() === '') return;
    if (datos.includes(nuevoDato.trim())) {
      Alert.alert("Aviso", "Este dato ya existe en tu base.");
      return;
    }
    alAgregar(nuevoDato);
    setNuevoDato('');
  };

  const confirmarEliminar = (texto) => {
    Alert.alert(
      "Borrar Post-it",
      `¿Seguro que quieres eliminar "${texto}" de tu base de datos?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: () => alEliminar(texto) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.contenedorPrincipal}>
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Base de Datos Maestra</Text>
        <Text style={styles.subtitulo}>Añade aquí materiales, clientes o tareas frecuentes. Se usarán para el autocompletado de la app.</Text>

        {/* Creador de Post-its */}
        <View style={styles.cajaCrear}>
          <TextInput 
            style={styles.inputDato} 
            placeholder="Ej: Instalación cuadro general..." 
            placeholderTextColor="#94a3b8"
            value={nuevoDato}
            onChangeText={setNuevoDato}
          />
          <TouchableOpacity style={styles.btnAgregar} onPress={manejarAgregar}>
            <Text style={styles.textoBtnAgregar}>+ Guardar</Text>
          </TouchableOpacity>
        </View>

        {/* Tablón de Post-its */}
        <ScrollView style={styles.tablon}>
          <View style={styles.gridPostits}>
            {datos.length === 0 ? (
              <Text style={styles.textoVacio}>No hay datos. ¡Crea tu primer post-it arriba!</Text>
            ) : (
              datos.map((dato, index) => (
                <View key={index} style={styles.postit}>
                  <Text style={styles.textoPostit}>{dato}</Text>
                  <TouchableOpacity style={styles.btnBorrarPostit} onPress={() => confirmarEliminar(dato)}>
                    <Text style={styles.iconoBorrar}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: '#f8fafc' },
  contenedor: { flex: 1, padding: 15 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', marginTop: 10, textAlign: 'center' },
  subtitulo: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  
  cajaCrear: { flexDirection: 'row', marginBottom: 20 },
  inputDato: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 15, height: 50, fontSize: 15 },
  btnAgregar: { backgroundColor: '#bbf7d0', borderWidth: 1, borderColor: '#86efac', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderRadius: 8, marginLeft: 10, elevation: 2 },
  textoBtnAgregar: { color: '#166534', fontWeight: 'bold', fontSize: 15 },

  tablon: { flex: 1 },
  gridPostits: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  textoVacio: { width: '100%', textAlign: 'center', color: '#94a3b8', marginTop: 40, fontStyle: 'italic' },
  
  postit: { width: '48%', backgroundColor: '#fef3c7', padding: 15, borderRadius: 4, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 3, borderBottomRightRadius: 15 },
  textoPostit: { fontSize: 14, color: '#334155', fontWeight: '500', marginBottom: 10, minHeight: 40 },
  btnBorrarPostit: { alignSelf: 'flex-end', backgroundColor: '#fecdd3', padding: 6, borderRadius: 15 },
  iconoBorrar: { fontSize: 12 }
});