import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Image, Modal, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GaleriaScreen({ elementos, setElementos, tareasConFolio = [], alAdjuntarFoto }) {
  
  // Estados para controlar el menú flotante en la galería
  const [modalVisible, setModalVisible] = useState(false);
  const [itemActivo, setItemActivo] = useState(null);

  const manejarCompartir = async (item) => {
    try {
      if (item.uri) {
        const disponible = await Sharing.isAvailableAsync();
        if (disponible) {
          await Sharing.shareAsync(item.uri, { dialogTitle: `Compartir: ${item.titulo}` });
        } else {
          Alert.alert("Aviso", "No se puede compartir archivos en este dispositivo.");
        }
      } else {
        await Share.share({ message: `Mira este archivo de mi Agenda: ${item.titulo}` });
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir el archivo.");
    }
  };

  // Función que abre el Modal de tareas
  const manejarAdjuntar = (item) => {
    if (tareasConFolio.length === 0) {
      Alert.alert("Aviso", "No tienes tareas con folio abierto.");
      return;
    }
    setItemActivo(item);
    setModalVisible(true);
  };

  // Función que pega la foto seleccionada de la galería en la tarea
  const seleccionarTarea = (idTarea) => {
    if (itemActivo && itemActivo.uri) {
      alAdjuntarFoto(idTarea, itemActivo.uri);
    } else {
      Alert.alert("Aviso", "Este archivo no tiene una imagen válida para adjuntar.");
    }
    setModalVisible(false);
    setItemActivo(null);
  };

  const manejarGuardar = (titulo) => {
    Alert.alert("Guardado", `"${titulo}" asegurado en el almacenamiento local.`);
  };

  const manejarBorrar = (id, titulo) => {
    Alert.alert(
      "Eliminar archivo",
      `¿Seguro que deseas borrar "${titulo}"?`,
      [{ text: "Cancelar", style: "cancel" }, { text: "Borrar", style: "destructive", onPress: () => setElementos(elementos.filter(item => item.id !== id)) }]
    );
  };

  return (
    <SafeAreaView style={styles.contenedorPrincipal}>
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Galería de Archivos</Text>

        <ScrollView style={styles.scrollGaleria}>
          <View style={styles.gridGaleria}>
            {elementos.map((item) => (
              <View key={item.id} style={styles.tarjetaPolaroid}>
                
                <View style={styles.marcoFoto}>
                  {item.uri ? (
                    <Image source={{ uri: item.uri }} style={styles.imagenMiniatura} />
                  ) : (
                    <View style={styles.placeholderCaja}>
                      <Text style={styles.textoTipoArchivo}>📄 [{item.tipo}]</Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoPolaroid}>
                  <Text style={styles.textoTituloFoto} numberOfLines={1}>{item.titulo}</Text>
                  <Text style={styles.textoFecha}>{item.fecha}</Text>
                </View>

                <View style={styles.barraBotonesPolaroid}>
                  <TouchableOpacity style={[styles.btnAccionPolaroid, { backgroundColor: '#fed7aa' }]} onPress={() => manejarCompartir(item)}>
                    <Text style={styles.iconoPolaroid}>📤</Text>
                  </TouchableOpacity>
                  
                  {/* CONECTADO AL MENÚ FLOTANTE */}
                  <TouchableOpacity style={[styles.btnAccionPolaroid, { backgroundColor: '#bae6fd' }]} onPress={() => manejarAdjuntar(item)}>
                    <Text style={styles.iconoPolaroid}>📎</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.btnAccionPolaroid, { backgroundColor: '#bbf7d0' }]} onPress={() => manejarGuardar(item.titulo)}>
                    <Text style={styles.iconoPolaroid}>💾</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.btnAccionPolaroid, { backgroundColor: '#fecdd3' }]} onPress={() => manejarBorrar(item.id, item.titulo)}>
                    <Text style={styles.iconoPolaroid}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* MODAL EMERGENTE PARA ELEGIR TAREA EN GALERÍA */}
        <Modal visible={modalVisible} transparent={true} animationType="fade">
          <View style={styles.fondoOscuroModal}>
            <View style={styles.cajaModal}>
              <Text style={styles.tituloModal}>¿A qué tarea la adjuntamos?</Text>
              <ScrollView style={styles.listaTareasModal}>
                {tareasConFolio.map((tarea) => (
                  <TouchableOpacity key={tarea.id} style={styles.botonTareaModal} onPress={() => seleccionarTarea(tarea.id)}>
                    <Text style={styles.textoTareaModal}>📄 {tarea.titulo}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalVisible(false)}>
                <Text style={styles.textoCerrarModal}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: '#f8fafc' },
  contenedor: { flex: 1, padding: 15 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, textAlign: 'center', marginTop: 10 },
  scrollGaleria: { flex: 1 },
  gridGaleria: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tarjetaPolaroid: { width: '48%', backgroundColor: 'white', borderRadius: 12, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#cbd5e1', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  marcoFoto: { height: 120, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8, overflow: 'hidden' },
  imagenMiniatura: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderCaja: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  infoPolaroid: { marginBottom: 10 },
  textoTipoArchivo: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  textoTituloFoto: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  textoFecha: { fontSize: 10, color: '#94a3b8' },
  barraBotonesPolaroid: { flexDirection: 'row', justifyContent: 'space-between' },
  btnAccionPolaroid: { flex: 1, height: 32, marginHorizontal: 2, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 1 },
  iconoPolaroid: { fontSize: 12 },
  
  /* ESTILOS DEL MODAL */
  fondoOscuroModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  cajaModal: { backgroundColor: 'white', width: '100%', borderRadius: 12, padding: 20, maxHeight: '80%', elevation: 5 },
  tituloModal: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  listaTareasModal: { marginBottom: 15 },
  botonTareaModal: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  textoTareaModal: { fontSize: 15, color: '#334155', fontWeight: '500' },
  btnCerrarModal: { backgroundColor: '#fecdd3', padding: 12, borderRadius: 8, alignItems: 'center' },
  textoCerrarModal: { color: '#be123c', fontWeight: 'bold', fontSize: 15 }
});