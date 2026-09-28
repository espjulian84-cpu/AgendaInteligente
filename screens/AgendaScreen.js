import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function AgendaScreen() {
  return (
    <View style={styles.contenedor}>
      
      {/* 1. CABECERA CORREGIDA: Ahora se adapta al ancho de la pantalla */}
      <View style={styles.cabecera}>
        <Text style={styles.titulo} numberOfLines={1}>Agenda</Text>
        <View style={styles.grupoBotonesCabecera}>
          <TouchableOpacity style={styles.botonCabecera}><Text style={styles.textoBtnCab}>📅</Text></TouchableOpacity>
          <TouchableOpacity style={styles.botonCabecera}><Text style={styles.textoBtnCab}>🧮</Text></TouchableOpacity>
        </View>
      </View>

      {/* 2. ZONA DE AÑADIR: Subtítulo, Botón + y Contador */}
      <View style={styles.filaSubtitulo}>
        <Text style={styles.subtitulo}>Tareas Diarias</Text>
        
        <TouchableOpacity style={styles.botonMas}>
          <Text style={styles.textoBotonMas}>+</Text>
        </TouchableOpacity>
        
        <View style={styles.contadorCaja}>
          <Text style={styles.textoContador}>0 de 0 Realizadas</Text>
        </View>
      </View>

      {/* 3. LISTA DE TAREAS: El recuadro grande central */}
      <ScrollView style={styles.cajaTareas}>
        <View style={styles.cabeceraLista}>
          <Text style={styles.espacioBotones}></Text> 
          <Text style={styles.columnaTitulo}>Título</Text>
          <Text style={styles.columnaDatos}>Alarma</Text>
          <Text style={styles.columnaDatos}>Fecha</Text>
        </View>

        <View style={styles.filaTarea}>
          <View style={styles.grupoBotonesAccion}>
            <TouchableOpacity style={styles.botonAccion}><Text>✔️</Text></TouchableOpacity>
            <TouchableOpacity style={styles.botonAccion}><Text>✏️</Text></TouchableOpacity>
            <TouchableOpacity style={styles.botonAccion}><Text>🗑️</Text></TouchableOpacity>
          </View>
          <Text style={styles.columnaTitulo}>Revisar planos</Text>
          <Text style={styles.columnaDatos}>10:00</Text>
          <Text style={styles.columnaDatos}>27/09</Text>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f0f0f0', padding: 15 },
  
  // Cabecera ajustada para evitar solapamientos
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  titulo: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  grupoBotonesCabecera: { flexDirection: 'row' },
  botonCabecera: { backgroundColor: '#ddd', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, marginLeft: 8 },
  textoBtnCab: { fontSize: 14 },
  
  filaSubtitulo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  subtitulo: { fontSize: 16, marginRight: 10, fontWeight: '600' },
  botonMas: { backgroundColor: '#007BFF', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  textoBotonMas: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  contadorCaja: { borderWidth: 1, borderColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  textoContador: { fontSize: 12 },
  
  cajaTareas: { flex: 1, borderWidth: 1, borderColor: '#333', backgroundColor: 'white', borderRadius: 5, padding: 10 },
  cabeceraLista: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 5, marginBottom: 10 },
  filaTarea: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10 },
  
  grupoBotonesAccion: { flexDirection: 'row', width: 75, justifyContent: 'space-between', marginRight: 5 },
  botonAccion: { borderWidth: 1, borderColor: '#ccc', width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 3 },
  espacioBotones: { width: 80 },
  
  columnaTitulo: { flex: 1, fontSize: 14, fontWeight: 'bold' },
  columnaDatos: { width: 55, fontSize: 12, textAlign: 'center' },
});