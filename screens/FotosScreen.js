import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Importamos SvgImage para meter la foto DENTRO del lienzo de dibujo
import Svg, { Ellipse, Line, Polyline, Rect, Image as SvgImage } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

export default function FotosScreen({ alGuardarFoto, tareasConFolio = [], alAdjuntarFoto }) {
  const [imagenUri, setImagenUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const capturaRef = useRef();

  const [colorActivo, setColorActivo] = useState('#ef4444');
  const [herramientaActiva, setHerramientaActiva] = useState('lapiz');
  const [trazos, setTrazos] = useState([]);
  const [trazoActual, setTrazoActual] = useState(null);

  const colores = ['#ef4444', '#22c55e', '#eab308', '#3b82f6'];

  const tomarFotoReal = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) return Alert.alert("Aviso", "Se necesita cámara.");
      
      const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
      if (!resultado.canceled && resultado.assets.length > 0) {
        setImagenUri(resultado.assets[0].uri);
        setTrazos([]);
      }
    } catch (error) { Alert.alert("Error", "No se pudo abrir la cámara."); }
  };

  const iniciarTrazo = (e) => {
    if (!imagenUri) return;
    const { locationX, locationY } = e.nativeEvent;
    if (herramientaActiva === 'lapiz') {
      setTrazoActual({ tipo: 'lapiz', color: colorActivo, puntos: [`${locationX},${locationY}`] });
    } else {
      setTrazoActual({ tipo: herramientaActiva, color: colorActivo, x1: locationX, y1: locationY, x2: locationX, y2: locationY });
    }
  };

  const dibujarTrazo = (e) => {
    if (!trazoActual || !imagenUri) return;
    const { locationX, locationY } = e.nativeEvent;
    if (herramientaActiva === 'lapiz') {
      setTrazoActual(prev => ({ ...prev, puntos: [...prev.puntos, `${locationX},${locationY}`] }));
    } else {
      setTrazoActual(prev => ({ ...prev, x2: locationX, y2: locationY }));
    }
  };

  const finalizarTrazo = () => {
    if (trazoActual) {
      setTrazos(prev => [...prev, trazoActual]);
      setTrazoActual(null);
    }
  };

  const renderizarTrazo = (t, index) => {
    if (!t) return null;
    const key = index !== undefined ? index : 'actual';
    if (t.tipo === 'lapiz') return <Polyline key={key} points={t.puntos.join(' ')} fill="none" stroke={t.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />;
    if (t.tipo === 'linea') return <Line key={key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.color} strokeWidth="4" strokeLinecap="round" />;
    if (t.tipo === 'rectangulo') return <Rect key={key} x={Math.min(t.x1, t.x2)} y={Math.min(t.y1, t.y2)} width={Math.abs(t.x2 - t.x1)} height={Math.abs(t.y2 - t.y1)} fill="none" stroke={t.color} strokeWidth="4" />;
    if (t.tipo === 'circulo') return <Ellipse key={key} cx={(t.x1 + t.x2) / 2} cy={(t.y1 + t.y2) / 2} rx={Math.abs(t.x2 - t.x1) / 2} ry={Math.abs(t.y2 - t.y1) / 2} fill="none" stroke={t.color} strokeWidth="4" />;
  };

  const obtenerImagenFusionada = async () => {
    if (capturaRef.current) {
      try {
        const uriFusionada = await captureRef(capturaRef, {
          format: 'jpg',
          quality: 0.9,
          result: 'tmpfile'
        });
        return uriFusionada;
      } catch (error) {
        Alert.alert("Error", "No se pudo fusionar el dibujo con la foto.");
        return imagenUri;
      }
    }
    return imagenUri; 
  };

  const manejarCompartir = async () => {
    if (!imagenUri) return Alert.alert("Aviso", "Primero haz una foto.");
    try {
      if (await Sharing.isAvailableAsync()) {
        const imagenFinal = await obtenerImagenFusionada();
        await Sharing.shareAsync(imagenFinal, { dialogTitle: 'Compartir Captura' });
        if (alGuardarFoto) alGuardarFoto(imagenFinal, true); 
      }
    } catch (error) { Alert.alert("Error", "No se pudo compartir."); }
  };

  const manejarGuardado = async () => {
    if (!imagenUri) return Alert.alert("Aviso", "Primero haz una foto.");
    if (alGuardarFoto) {
      const imagenFinal = await obtenerImagenFusionada();
      alGuardarFoto(imagenFinal, false);
      setImagenUri(null);
      setTrazos([]);
    }
  };

  const seleccionarTarea = async (idTarea) => {
    const imagenFinal = await obtenerImagenFusionada();
    alAdjuntarFoto(idTarea, imagenFinal); 
    if (alGuardarFoto) alGuardarFoto(imagenFinal, true); 
    setModalVisible(false);
    setImagenUri(null);
    setTrazos([]);
  };

  const estiloBtnH = (herramienta) => [styles.btnHerramienta, herramientaActiva === herramienta && { borderColor: '#1e293b', borderWidth: 2, backgroundColor: '#f1f5f9' }];
  const estiloBtnC = (color) => [styles.btnColor, { backgroundColor: color }, colorActivo === color && { borderColor: '#1e293b', borderWidth: 3 }];

  return (
    <SafeAreaView style={styles.contenedorPrincipal}>
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Cámara y Notas</Text>

        <View style={styles.lienzo}>
          <View style={styles.panelIzquierda}>
            {colores.map(c => (
              <TouchableOpacity key={c} style={estiloBtnC(c)} onPress={() => setColorActivo(c)} />
            ))}
          </View>

          <View style={styles.areaFoto}>
            {imagenUri ? (
              <View ref={capturaRef} style={styles.viewShotContenedor} collapsable={false}>
                <View 
                  style={styles.capaInteracciones}
                  collapsable={false}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={iniciarTrazo}
                  onResponderMove={dibujarTrazo}
                  onResponderRelease={finalizarTrazo}
                >
                  <Svg style={StyleSheet.absoluteFillObject}>
                    {/* LA FOTO AHORA VIVE DENTRO DEL DIBUJO SVG */}
                    <SvgImage
                      href={{ uri: imagenUri }}
                      x="0"
                      y="0"
                      width="100%"
                      height="100%"
                      preserveAspectRatio="xMidYMid meet"
                    />
                    {trazos.map((t, i) => renderizarTrazo(t, i))}
                    {renderizarTrazo(trazoActual)}
                  </Svg>
                </View>
              </View>
            ) : (
              <Text style={styles.textoFoto}>Pulsa "📸 Foto" para activar la cámara</Text>
            )}
          </View>

          <View style={styles.panelDerecha}>
            <TouchableOpacity style={estiloBtnH('lapiz')} onPress={() => setHerramientaActiva('lapiz')}><Text style={styles.iconoHerramienta}>✏️</Text></TouchableOpacity>
            <TouchableOpacity style={estiloBtnH('linea')} onPress={() => setHerramientaActiva('linea')}><Text style={styles.iconoHerramienta}>📏</Text></TouchableOpacity>
            <TouchableOpacity style={estiloBtnH('rectangulo')} onPress={() => setHerramientaActiva('rectangulo')}><Text style={styles.iconoHerramienta}>◻️</Text></TouchableOpacity>
            <TouchableOpacity style={estiloBtnH('circulo')} onPress={() => setHerramientaActiva('circulo')}><Text style={styles.iconoHerramienta}>⭕</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnHerramienta} onPress={() => setTrazos(prev => prev.slice(0, -1))}><Text style={styles.iconoHerramienta}>↩️</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnHerramienta, { backgroundColor: '#fecdd3' }]} onPress={() => { setImagenUri(null); setTrazos([]); }}><Text style={styles.iconoHerramienta}>🗑️</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.barraInferiorBocetos}>
          <TouchableOpacity style={[styles.btnInferior, { backgroundColor: '#e0f2fe' }]} onPress={tomarFotoReal}><Text style={styles.textoBtnInferior}>📸 Foto</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btnInferior, { backgroundColor: '#fed7aa' }]} onPress={manejarCompartir}><Text style={styles.textoBtnInferior}>Comp.</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btnInferior, { backgroundColor: '#bae6fd' }]} onPress={() => { if(!imagenUri) return Alert.alert("Aviso", "Toma una foto primero."); if(tareasConFolio.length===0) return Alert.alert("Aviso", "No hay tareas con folio."); setModalVisible(true); }}><Text style={styles.textoBtnInferior}>Adjuntar</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btnInferior, { backgroundColor: '#bbf7d0' }]} onPress={manejarGuardado}><Text style={styles.textoBtnInferior}>Guard.</Text></TouchableOpacity>
        </View>

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
              <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalVisible(false)}><Text style={styles.textoCerrarModal}>Cancelar</Text></TouchableOpacity>
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
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#1e293b' },
  lienzo: { flex: 1, flexDirection: 'row', backgroundColor: 'white', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  panelIzquierda: { width: 45, paddingVertical: 10, justifyContent: 'space-around', alignItems: 'center', borderRightWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  btnColor: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#94a3b8' },
  areaFoto: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  textoFoto: { color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 10 },
  
  // Fondo blanco garantizado
  viewShotContenedor: { flex: 1, width: '100%', height: '100%', backgroundColor: '#ffffff' },
  capaInteracciones: { ...StyleSheet.absoluteFillObject, zIndex: 10 },

  panelDerecha: { width: 45, paddingVertical: 10, justifyContent: 'space-around', alignItems: 'center', borderLeftWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  btnHerramienta: { padding: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', width: 34, height: 34 },
  iconoHerramienta: { fontSize: 15 },
  barraInferiorBocetos: { flexDirection: 'row', height: 48, justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  btnInferior: { flex: 1, marginHorizontal: 3, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  textoBtnInferior: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  fondoOscuroModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  cajaModal: { backgroundColor: 'white', width: '100%', borderRadius: 12, padding: 20, maxHeight: '80%', elevation: 5 },
  tituloModal: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  listaTareasModal: { marginBottom: 15 },
  botonTareaModal: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  textoTareaModal: { fontSize: 15, color: '#334155', fontWeight: '500' },
  btnCerrarModal: { backgroundColor: '#fecdd3', padding: 12, borderRadius: 8, alignItems: 'center' },
  textoCerrarModal: { color: '#be123c', fontWeight: 'bold', fontSize: 15 }
});