import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';

import BaseScreen from '../../screens/BaseScreen';
import BocetosScreen from '../../screens/BocetosScreen';
import FotosScreen from '../../screens/FotosScreen';
import GaleriaScreen from '../../screens/GaleriaScreen';

// Interfaces TypeScript para evitar errores de compilación
interface Tarea {
  id: number;
  titulo: string;
  alarma: string;
  fecha: string;
  ubicacion: string;
  hojaAdjunta: boolean;
  notaHoja: string;
  direccionGps: string;
  gpsActivado: boolean;
  completada: boolean;
  alertaDisparada?: boolean;
  fotos?: string[];
}

interface ElementoGaleria {
  id: number;
  tipo: string;
  titulo: string;
  fecha: string;
  uri: string;
}

interface HistorialItem {
  id: number;
  texto: string;
  timestamp: number;
}

export default function AppPrincipal() {
  const [pantallaActiva, setPantallaActiva] = useState<string>('Agenda');
  const [modoAgenda, setModoAgenda] = useState<string>('lista'); 
  const [origenCalendario, setOrigenCalendario] = useState<string>('lista'); 
  
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [textoHojaTemporal, setTextoHojaTemporal] = useState<string>('');
  const [textoFolioEditable, setTextoFolioEditable] = useState<string>('');

  const [datosBase, setDatosBase] = useState<string[]>([]); 
  const [calcInput, setCalcInput] = useState<string>('0');
  const [calcHistorial, setCalcHistorial] = useState<HistorialItem[]>([]);

  // Estados del Calendario Profesional (Septiembre 2026)
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(8); 
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(2026);
  const [fechaCalendarioActiva, setFechaCalendarioActiva] = useState<string>('28/09/2026');
  const [tareasDelDiaDesplegadas, setTareasDelDiaDesplegadas] = useState<Tarea[]>([]);

  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [elementosGaleria, setElementosGaleria] = useState<ElementoGaleria[]>([]);

  const [nuevoTitulo, setNuevoTitulo] = useState<string>('');
  const [alarmaSeleccionada, setAlarmaSeleccionada] = useState<string>('10:00');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('28/09/2026');
  
  const [direccionGpsInput, setDireccionGpsInput] = useState<string>('');
  const [mostrarSelectorUbicaciones, setMostrarSelectorUbicaciones] = useState<boolean>(false);

  const [hojaAdjunta, setHojaAdjunta] = useState<boolean>(false);
  const [mostrarSelectorHoras, setMostrarSelectorHoras] = useState<boolean>(false);

  const generarHoras15Min = () => {
    let horas: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const horaStr = String(h).padStart(2, '0');
        const minStr = String(m).padStart(2, '0');
        horas.push(`${horaStr}:${minStr}`);
      }
    }
    return horas;
  };
  const horasDisponibles = generarHoras15Min();

  useEffect(() => {
    cargarBaseGlobal();
    cargarHistorialCalculadora();
    cargarTareasGuardadas();

    const intervaloAlarma = setInterval(() => {
      verificarAlarmasHorarias();
    }, 15000);

    return () => clearInterval(intervaloAlarma);
  }, [tareas]);

  const cargarTareasGuardadas = async () => {
    try {
      const tareasGuardadas = await AsyncStorage.getItem('mis_tareas_agenda');
      if (tareasGuardadas !== null) {
        setTareas(JSON.parse(tareasGuardadas));
      }
    } catch (error) {
      console.log('Error cargando tareas', error);
    }
  };

  const guardarTareasLocal = async (nuevasTareas: Tarea[]) => {
    setTareas(nuevasTareas);
    try {
      await AsyncStorage.setItem('mis_tareas_agenda', JSON.stringify(nuevasTareas));
    } catch (error) {
      console.log('Error guardando tareas', error);
    }
  };

  const verificarAlarmasHorarias = () => {
    const ahora = new Date();
    const fechaActualStr = `${String(ahora.getDate()).padStart(2, '0')}/${String(ahora.getMonth() + 1).padStart(2, '0')}/${ahora.getFullYear()}`;
    const horaActualStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    let tareasModificadas = false;
    const nuevasTareas = tareas.map(t => {
      if (!t.completada && t.fecha === fechaActualStr && t.alarma === horaActualStr && !t.alertaDisparada) {
        Vibration.vibrate([1000, 500, 1000, 500, 1000]);
        Alert.alert(
          "🚨 ¡ALARMA DE TAREA ACTIVA!",
          `Es la hora (${t.alarma}) de tu tarea:\n\n📌 "${t.titulo}"${t.direccionGps ? `\n📍 Destino: ${t.direccionGps}` : ''}`,
          [{ text: "Apagar Alarma / Entendido", style: "default" }],
          { cancelable: false }
        );
        tareasModificadas = true;
        return { ...t, alertaDisparada: true };
      }
      return t;
    });

    if (tareasModificadas) {
      guardarTareasLocal(nuevasTareas);
    }
  };

  const abrirGoogleMapsExterno = () => {
    const urlMaps = "https://maps.google.com";
    Linking.canOpenURL(urlMaps).then(supported => {
      if (supported) Linking.openURL(urlMaps);
      else Linking.openURL(urlMaps);
    }).catch(() => {
      Linking.openURL(urlMaps);
    });
  };

  const cargarBaseGlobal = async () => {
    try {
      const bdGuardada = await AsyncStorage.getItem('base_datos_maestra');
      if (bdGuardada !== null) {
        setDatosBase(JSON.parse(bdGuardada));
      } else {
        setDatosBase([]);
      }
    } catch (error) { 
      console.log('Error cargando BD global', error); 
    }
  };

  const cargarHistorialCalculadora = async () => {
    try {
      const historialGuardado = await AsyncStorage.getItem('historial_calculadora_7dias');
      if (historialGuardado !== null) {
        const parsedHistorial: HistorialItem[] = JSON.parse(historialGuardado);
        const ahora = Date.now();
        const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;
        const historialVigente = parsedHistorial.filter(item => (ahora - item.timestamp) < sieteDiasMs);
        setCalcHistorial(historialVigente);
        await AsyncStorage.setItem('historial_calculadora_7dias', JSON.stringify(historialVigente));
      }
    } catch (error) {
      console.log('Error cargando historial calculadora', error);
    }
  };

  const guardarOperacionEnHistorial = async (operacionCompleta: string) => {
    const nuevoItem: HistorialItem = {
      id: Date.now(),
      texto: operacionCompleta,
      timestamp: Date.now()
    };
    const nuevoHistorial = [nuevoItem, ...calcHistorial];
    setCalcHistorial(nuevoHistorial);
    try {
      await AsyncStorage.setItem('historial_calculadora_7dias', JSON.stringify(nuevoHistorial));
    } catch (error) {
      console.log('Error guardando historial', error);
    }
  };

  const presionarCalculadora = (valor: string) => {
    if (valor === 'C') {
      setCalcInput('0');
      return;
    }
    if (valor === '⌫') {
      setCalcInput(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      return;
    }
    if (valor === '=') {
      try {
        const expresionLimpia = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
        const resultado = eval(expresionLimpia);
        const operacionFinal = `${calcInput} = ${resultado}`;
        setCalcInput(String(resultado));
        guardarOperacionEnHistorial(operacionFinal);
      } catch (e) {
        setCalcInput('Error');
      }
      return;
    }

    setCalcInput(prev => (prev === '0' || prev === 'Error') ? valor : prev + valor);
  };

  const agregarABase = async (texto: string) => {
    const nuevosDatos = [...datosBase, texto.trim()];
    setDatosBase(nuevosDatos);
    await AsyncStorage.setItem('base_datos_maestra', JSON.stringify(nuevosDatos));
  };

  const eliminarDeBase = async (texto: string) => {
    const nuevosDatos = datosBase.filter(item => item !== texto);
    setDatosBase(nuevosDatos);
    await AsyncStorage.setItem('base_datos_maestra', JSON.stringify(nuevosDatos));
  };

  const guardarTarea = () => {
    if (nuevoTitulo.trim() === '') {
      Alert.alert("Atención", "Escribe un título para la tarea.");
      return;
    }
    
    const nueva: Tarea = {
      id: Date.now(),
      titulo: nuevoTitulo.trim(),
      alarma: alarmaSeleccionada,
      fecha: fechaSeleccionada,
      ubicacion: direccionGpsInput.trim() !== '' ? direccionGpsInput.trim() : 'Sin ubicación GPS',
      hojaAdjunta: hojaAdjunta,
      notaHoja: textoHojaTemporal + (direccionGpsInput.trim() !== '' ? `\n📍 Destino Maps: ${direccionGpsInput.trim()}` : ''),
      direccionGps: direccionGpsInput.trim(),
      gpsActivado: direccionGpsInput.trim() !== '',
      completada: false,
      alertaDisparada: false,
      fotos: []
    };
    
    const actualizadas = [...tareas, nueva];
    guardarTareasLocal(actualizadas);
    Vibration.vibrate(300);
    Alert.alert("⏰ Alarma Programada", `Tarea "${nueva.titulo}" guardada para las ${nueva.alarma} del ${nueva.fecha}.`);

    setNuevoTitulo('');
    setTextoHojaTemporal('');
    setHojaAdjunta(false);
    setDireccionGpsInput('');
    setModoAgenda('lista');
  };

  const guardarFotoEnGaleriaGlobal = (uriFoto: string, silenciarAlerta: boolean = false) => {
    const nuevoElemento: ElementoGaleria = { id: Date.now(), tipo: 'Foto', titulo: `Captura ${new Date().toLocaleTimeString()}`, fecha: fechaSeleccionada, uri: uriFoto };
    setElementosGaleria([nuevoElemento, ...elementosGaleria]);
    if (!silenciarAlerta) Alert.alert("¡Hecho!", "La foto está en la Galería.");
  };

  const guardarBocetoEnGaleriaGlobal = (uriBoceto: string, silenciarAlerta: boolean = false) => {
    const nuevoElemento: ElementoGaleria = { id: Date.now(), tipo: 'Boceto', titulo: `Boceto ${new Date().toLocaleTimeString()}`, fecha: fechaSeleccionada, uri: uriBoceto };
    setElementosGaleria([nuevoElemento, ...elementosGaleria]);
    if (!silenciarAlerta) Alert.alert("¡Hecho!", "El boceto está en la Galería.");
  };

  const adjuntarFotoATarea = (idTarea: number, uriFoto: string) => {
    const actualizadas = tareas.map(t => {
      if (t.id === idTarea) return { ...t, fotos: [...(t.fotos || []), uriFoto] };
      return t;
    });
    guardarTareasLocal(actualizadas);
    Alert.alert("¡Adjuntado!", "El archivo se ha pegado en el folio de la tarea.");
  };

  const eliminarTarea = (id: number) => {
    const actualizadas = tareas.filter(t => t.id !== id);
    guardarTareasLocal(actualizadas);
  };

  const alternarCompletada = (id: number) => {
    const actualizadas = tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t);
    guardarTareasLocal(actualizadas);
  };

  const abrirFolioTarea = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setTextoFolioEditable(tarea.notaHoja || '');
    setModoAgenda('verTarea');
  };

  const actualizarNotaFolio = () => {
    if (!tareaSeleccionada) return;
    const actualizadas = tareas.map(t => {
      if (t.id === tareaSeleccionada.id) {
        return { ...t, notaHoja: textoFolioEditable };
      }
      return t;
    });
    guardarTareasLocal(actualizadas);
    setModoAgenda('lista');
    Alert.alert("¡Actualizado!", "El folio se ha guardado correctamente.");
  };

  const tareasRealizadas = tareas.filter(t => t.completada).length;
  const totalTareas = tareas.length;

  const cambiarMes = (direccion: number) => {
    let nuevoMes = mesSeleccionado + direccion;
    let nuevoAnio = anioSeleccionado;
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio += 1; } 
    else if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio -= 1; }
    if (nuevoAnio >= 2025 && nuevoAnio <= 2027) {
      setMesSeleccionado(nuevoMes);
      setAnioSeleccionado(nuevoAnio);
    }
  };

  const generarMatrizCalendario = (mes: number, anio: number) => {
    const primerDiaDelMes = new Date(anio, mes, 1);
    const diaSemanaJS = primerDiaDelMes.getDay(); 
    const offsetLunes = diaSemanaJS === 0 ? 6 : diaSemanaJS - 1;
    
    const totalDiasMes = new Date(anio, mes + 1, 0).getDate();
    
    let celdas: (number | null)[] = [];
    for (let i = 0; i < offsetLunes; i++) {
      celdas.push(null);
    }
    for (let d = 1; d <= totalDiasMes; d++) {
      celdas.push(d);
    }
    return celdas;
  };

  const celdasCalendario = generarMatrizCalendario(mesSeleccionado, anioSeleccionado);

  const seleccionarDiaCalendario = (dia: number | null) => {
    if (!dia) return;
    const mesFormateado = String(mesSeleccionado + 1).padStart(2, '0');
    const diaFormateado = String(dia).padStart(2, '0');
    const fechaStr = `${diaFormateado}/${mesFormateado}/${anioSeleccionado}`;
    
    setFechaCalendarioActiva(fechaStr);
    setFechaSeleccionada(fechaStr);

    const tareasEnFecha = tareas.filter(t => t.fecha === fechaStr);
    if (tareasEnFecha.length > 0) {
      setTareasDelDiaDesplegadas(tareasEnFecha);
    } else {
      setTareasDelDiaDesplegadas([]); 
    }
  };

  const fechaHoyObj = new Date();
  const fechaHoyCompleta = `${String(fechaHoyObj.getDate()).padStart(2, '0')}/${String(fechaHoyObj.getMonth() + 1).padStart(2, '0')}/${fechaHoyObj.getFullYear()}`;

  return (
    <SafeAreaView style={styles.contenedorPrincipal}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.zonaContenido}>
        
        {/* AGENDA - VISTA LISTA */}
        {pantallaActiva === 'Agenda' && modoAgenda === 'lista' && (
          <View style={styles.contenedor}>
            <View style={styles.cabecera}>
              <Text style={styles.titulo} numberOfLines={1}>Agenda</Text>
              <View style={styles.grupoBotonesCabecera}>
                <TouchableOpacity style={[styles.botonCabecera, { backgroundColor: '#fed7aa' }]} onPress={() => { setOrigenCalendario('lista'); setModoAgenda('calendario'); }}>
                  <Text style={styles.textoBtnCab}>📅</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.botonCabecera, { backgroundColor: '#bae6fd' }]} onPress={() => setModoAgenda('calculadora')}>
                  <Text style={styles.textoBtnCab}>🧮</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filaSubtitulo}>
              <Text style={styles.subtitulo}>Tareas Diarias</Text>
              <TouchableOpacity style={styles.botonMas} onPress={() => { setFechaSeleccionada(fechaCalendarioActiva); setModoAgenda('crear'); }}>
                <Text style={styles.textoBotonMas}>+</Text>
              </TouchableOpacity>
              <View style={styles.contadorCaja}><Text style={styles.textoContador}>{tareasRealizadas} de {totalTareas} Realizadas</Text></View>
            </View>

            <ScrollView style={styles.cajaTareas}>
              <View style={styles.cabeceraLista}>
                <Text style={styles.espacioBotones}></Text> 
                <Text style={styles.columnaTitulo}>Título</Text>
                <Text style={styles.columnaDatos}>Alarma</Text>
                <Text style={styles.columnaDatos}>Fecha</Text>
              </View>

              {tareas.length > 0 ? (
                tareas.map((tarea) => (
                  <View key={tarea.id} style={styles.filaTarea}>
                    <View style={styles.grupoBotonesAccion}>
                      <TouchableOpacity style={[styles.botonAccion, { backgroundColor: tarea.completada ? '#86efac' : '#bbf7d0' }]} onPress={() => alternarCompletada(tarea.id)}><Text style={styles.iconoAccion}>✔️</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.botonAccion, { backgroundColor: '#fef08a' }]} onPress={() => abrirFolioTarea(tarea)}><Text style={styles.iconoAccion}>✏️</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.botonAccion, { backgroundColor: '#fecdd3' }]} onPress={() => eliminarTarea(tarea.id)}><Text style={styles.iconoAccion}>🗑️</Text></TouchableOpacity>
                    </View>
                    
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.columnaTitulo, tarea.completada && styles.textoTachado]} numberOfLines={1}>
                        {tarea.titulo}
                      </Text>
                      {tarea.hojaAdjunta && (
                        <TouchableOpacity onPress={() => abrirFolioTarea(tarea)} style={styles.botonIconoFolio}>
                          <Text style={{ fontSize: 13 }}>📄</Text>
                        </TouchableOpacity>
                      )}
                      {tarea.gpsActivado && <Text style={{ fontSize: 12, marginLeft: 3 }}>📍</Text>}
                      {tarea.fotos && tarea.fotos.length > 0 && <Text style={{ fontSize: 12, marginLeft: 3 }}>📷</Text>}
                    </View>

                    <Text style={styles.columnaDatos}>{tarea.alarma}</Text>
                    <Text style={styles.columnaDatos}>{tarea.fecha}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: 30 }}>No hay tareas programadas. Pulsa el botón [+] para crear una.</Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* VISTA CALENDARIO 100% PERFECTO (LUNES A DOMINGO) */}
        {pantallaActiva === 'Agenda' && modoAgenda === 'calendario' && (
          <View style={styles.contenedor}>
            <View style={styles.cabecera}>
              <Text style={styles.titulo}>Calendario</Text>
              <TouchableOpacity style={[styles.botonCabecera, { backgroundColor: '#e2e8f0' }]} onPress={() => setModoAgenda(origenCalendario === 'crear' ? 'crear' : 'lista')}>
                <Text style={styles.textoBtnCab}>🔙 Volver</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarioCajaContenedor}>
              <View style={styles.calendarioNavegacionHeader}>
                <TouchableOpacity style={styles.calendarioFlechaBtn} onPress={() => cambiarMes(-1)}><Text style={styles.calendarioFlechaTexto}>◀</Text></TouchableOpacity>
                <Text style={styles.calendarioMesTitulo}>{mesesNombres[mesSeleccionado]} {anioSeleccionado}</Text>
                <TouchableOpacity style={styles.calendarioFlechaBtn} onPress={() => cambiarMes(1)}><Text style={styles.calendarioFlechaTexto}>▶</Text></TouchableOpacity>
              </View>

              <Text style={styles.calendarioSeleccionTexto}>Seleccionado: <Text style={{ fontWeight: 'bold', color: '#0284c7' }}>{fechaCalendarioActiva}</Text></Text>

              <View style={styles.calendarioDiasSemanaRow}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, index) => (
                  <Text key={index} style={styles.calendarioDiaSemanaHeader}>{d}</Text>
                ))}
              </View>

              <View style={styles.calendarioDiasGrid}>
                {celdasCalendario.map((dia, index) => {
                  if (dia === null) return <View key={`vacio-${index}`} style={styles.calendarioDiaVacio} />;
                  const diaStr = String(dia).padStart(2, '0');
                  const mesStr = String(mesSeleccionado + 1).padStart(2, '0');
                  const fechaStr = `${diaStr}/${mesStr}/${anioSeleccionado}`;
                  const esHoy = fechaStr === fechaHoyCompleta;
                  const esSeleccionado = fechaCalendarioActiva === fechaStr;

                  return (
                    <TouchableOpacity 
                      key={`dia-${dia}`} 
                      style={[styles.calendarioDiaItem, esHoy && styles.calendarioDiaHoy, esSeleccionado && styles.calendarioDiaSeleccionado]}
                      onPress={() => seleccionarDiaCalendario(dia)}
                    >
                      <Text style={[styles.calendarioDiaTexto, (esHoy || esSeleccionado) && { color: 'white', fontWeight: 'bold' }]}>{dia}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {tareasDelDiaDesplegadas.length > 0 && (
                <View style={styles.calendarioDesplegableCaja}>
                  <Text style={styles.calendarioDesplegableTitulo}>📌 Tareas para el {fechaCalendarioActiva}:</Text>
                  {tareasDelDiaDesplegadas.map((t) => (
                    <View key={t.id} style={styles.calendarioDesplegableItem}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#1e293b' }}>• {t.titulo}</Text>
                      <Text style={{ fontSize: 10, color: '#64748b' }}>⏰ {t.alarma}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity style={[styles.botonGuardarMini, { marginTop: 8 }]} onPress={() => setModoAgenda(origenCalendario === 'crear' ? 'crear' : 'lista')}>
                <Text style={styles.textoBotonGuardar}>Aceptar y Volver</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CREAR TAREA (BOTÓN +) */}
        {pantallaActiva === 'Agenda' && modoAgenda === 'crear' && (
          <View style={styles.contenedor}>
            <View style={styles.cabecera}>
              <Text style={styles.titulo}>Nueva Tarea</Text>
              <TouchableOpacity style={[styles.botonCabecera, { backgroundColor: '#fecdd3' }]} onPress={() => setModoAgenda('lista')}>
                <Text style={styles.textoBtnCab}>❌ Cancelar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filaBotonesBoceto}>
              <TouchableOpacity style={[styles.cuadraditoBoceto, { backgroundColor: '#fef3c7' }]} onPress={() => setMostrarSelectorHoras(!mostrarSelectorHoras)}>
                <Text style={styles.iconoCuadradito}>⏰</Text>
                <Text style={styles.textoCuadradito}>{alarmaSeleccionada}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.cuadraditoBoceto, { backgroundColor: '#f3e8ff' }]} onPress={() => { setOrigenCalendario('crear'); setModoAgenda('calendario'); }}>
                <Text style={styles.iconoCuadradito}>📅</Text><Text style={styles.textoCuadradito}>{fechaSeleccionada}</Text>
              </TouchableOpacity>
            </View>

            {mostrarSelectorHoras && (
              <View style={styles.selectorHorasCaja}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 5 }}>Selecciona la Hora (15 min):</Text>
                <ScrollView style={{ maxHeight: 110 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {horasDisponibles.map((h) => (
                      <TouchableOpacity 
                        key={h} 
                        style={[styles.horaChip, alarmaSeleccionada === h && styles.horaChipSeleccionada]}
                        onPress={() => {
                          setAlarmaSeleccionada(h);
                          setMostrarSelectorHoras(false);
                        }}
                      >
                        <Text style={[styles.horaChipTexto, alarmaSeleccionada === h && { color: 'white' }]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.cajaAlargadaContenedor}>
              <View style={styles.cabeceraCajaNota}>
                <Text style={styles.labelForm}>Detalles de la tarea:</Text>
                <TouchableOpacity style={[styles.botonMasHoja, hojaAdjunta && { backgroundColor: '#86efac' }]} onPress={() => setModoAgenda('hojaNota')}>
                  <Text style={styles.textoBotonMasHoja}>{hojaAdjunta ? '✓ Hoja' : '+ Hoja'}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={{ marginBottom: 10 }}>
                <TextInput 
                  style={styles.inputAlargado} 
                  placeholder="Escribe título de la tarea..." 
                  placeholderTextColor="#94a3b8" 
                  value={nuevoTitulo} 
                  onChangeText={setNuevoTitulo} 
                />
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, marginTop: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.labelForm}>📍 Dirección de Destino (Google Maps):</Text>
                  {datosBase.length > 0 && (
                    <TouchableOpacity style={styles.botonBasePredef} onPress={() => setMostrarSelectorUbicaciones(!mostrarSelectorUbicaciones)}>
                      <Text style={styles.textoBotonMaps}>📌 Predefinidas ({datosBase.length})</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {mostrarSelectorUbicaciones && (
                  <View style={{ backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, marginBottom: 8, maxHeight: 100 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0284c7', marginBottom: 4 }}>Selecciona de tu Base de Datos:</Text>
                    <ScrollView>
                      {datosBase.map((itemBase, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={{ paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}
                          onPress={() => {
                            setDireccionGpsInput(itemBase);
                            setMostrarSelectorUbicaciones(false);
                          }}
                        >
                          <Text style={{ fontSize: 12, color: '#1e293b' }}>• {itemBase}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <TextInput 
                  style={styles.inputAlargado} 
                  placeholder="Pega aquí la dirección copiada de Google Maps..." 
                  placeholderTextColor="#94a3b8" 
                  value={direccionGpsInput} 
                  onChangeText={setDireccionGpsInput} 
                />

                <TouchableOpacity style={styles.botonMapsAbajo} onPress={abrirGoogleMapsExterno}>
                  <Text style={styles.textoBotonMapsGrande}>🗺️ Abrir Google Maps para Buscar y Copiar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.botonGuardarAlargado} onPress={guardarTarea}><Text style={styles.textoBotonGuardar}>Guardar Tarea y Activar Alarma</Text></TouchableOpacity>
          </View>
        )}

        {/* FOLIO DE NOTAS */}
        {pantallaActiva === 'Agenda' && modoAgenda === 'hojaNota' && (
          <View style={styles.contenedor}>
            <View style={styles.cabecera}>
              <Text style={styles.titulo}>Folio de Notas</Text>
              <TouchableOpacity style={styles.botonGuardarPequenoArriba} onPress={() => { setHojaAdjunta(true); setModoAgenda('crear'); }}>
                <Text style={styles.textoBotonGuardarPequeno}>💾 Guardar Hoja</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cajaAlargadaContenedor}>
              <TextInput 
                style={[styles.inputAlargado, { flex: 1, textAlignVertical: 'top' }]}
                placeholder="Escribe notas adicionales de la tarea..."
                placeholderTextColor="#94a3b8"
                multiline={true}
                value={textoHojaTemporal}
                onChangeText={setTextoHojaTemporal}
              />
            </View>
          </View>
        )}

        {/* CALCULADORA */}
        {pantallaActiva === 'Agenda' && modoAgenda === 'calculadora' && (
          <View style={styles.contenedor}>
            <View style={styles.cabecera}>
              <Text style={styles.titulo}>Calculadora</Text>
              <TouchableOpacity style={[styles.botonCabecera, { backgroundColor: '#e2e8f0' }]} onPress={() => setModoAgenda('lista')}>
                <Text style={styles.textoBtnCab}>🔙 Volver</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calcDisplayCaja}>
              <Text style={styles.calcDisplayText} numberOfLines={1} adjustsFontSizeToFit>{calcInput}</Text>
            </View>

            <View style={styles.calcBotonera}>
              <View style={styles.calcFila}>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#fecdd3' }]} onPress={() => presionarCalculadora('C')}><Text style={styles.calcBtnTextoRojo}>C</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#fed7aa' }]} onPress={() => presionarCalculadora('⌫')}><Text style={styles.calcBtnTexto}>⌫</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#fed7aa' }]} onPress={() => presionarCalculadora('%')}><Text style={styles.calcBtnTexto}>%</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#bfdbfe' }]} onPress={() => presionarCalculadora('÷')}><Text style={styles.calcBtnTextoAzul}>÷</Text></TouchableOpacity>
              </View>
              <View style={styles.calcFila}>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('7')}><Text style={styles.calcBtnTexto}>7</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('8')}><Text style={styles.calcBtnTexto}>8</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('9')}><Text style={styles.calcBtnTexto}>9</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#bfdbfe' }]} onPress={() => presionarCalculadora('×')}><Text style={styles.calcBtnTextoAzul}>×</Text></TouchableOpacity>
              </View>
              <View style={styles.calcFila}>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('4')}><Text style={styles.calcBtnTexto}>4</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('5')}><Text style={styles.calcBtnTexto}>5</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('6')}><Text style={styles.calcBtnTexto}>6</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#bfdbfe' }]} onPress={() => presionarCalculadora('-')}><Text style={styles.calcBtnTextoAzul}>-</Text></TouchableOpacity>
              </View>
              <View style={styles.calcFila}>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('1')}><Text style={styles.calcBtnTexto}>1</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('2')}><Text style={styles.calcBtnTexto}>2</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('3')}><Text style={styles.calcBtnTexto}>3</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#bfdbfe' }]} onPress={() => presionarCalculadora('+')}><Text style={styles.calcBtnTextoAzul}>+</Text></TouchableOpacity>
              </View>
              <View style={styles.calcFila}>
                <TouchableOpacity style={[styles.calcBtnGrande, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('0')}><Text style={styles.calcBtnTexto}>0</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#f8fafc' }]} onPress={() => presionarCalculadora('.')}><Text style={styles.calcBtnTexto}>.</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.calcBtn, { backgroundColor: '#bbf7d0' }]} onPress={() => presionarCalculadora('=')}><Text style={styles.calcBtnTextoVerde}>=</Text></TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.labelForm, { marginTop: 10 }]}>Historial (Guardado 7 días):</Text>
            <ScrollView style={styles.calcHistorialCaja}>
              {calcHistorial.length > 0 ? (
                calcHistorial.map((item) => (
                  <View key={item.id} style={styles.calcHistorialItem}>
                    <Text style={styles.calcHistorialTexto}>📌 {item.texto}</Text>
                    <Text style={styles.calcHistorialFecha}>{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: '#94a3b8', fontStyle: 'italic', padding: 5 }}>No hay operaciones recientes.</Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* VER TAREA (FOLIO ABIERTO) */}
        {pantallaActiva === 'Agenda' && modoAgenda === 'verTarea' && tareaSeleccionada && (
          <View style={styles.contenedor}>
            <View style={styles.cabecera}>
              <Text style={styles.titulo} numberOfLines={1}>Folio Abierto</Text>
              <TouchableOpacity style={[styles.botonCabecera, { backgroundColor: '#e2e8f0' }]} onPress={() => setModoAgenda('lista')}>
                <Text style={styles.textoBtnCab}>🔙 Volver</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cajaAlargadaContenedor}>
              <Text style={styles.labelForm}>{tareaSeleccionada.titulo}</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 15 }}>📍 {tareaSeleccionada.ubicacion} | ⏰ {tareaSeleccionada.alarma} | 📅 {tareaSeleccionada.fecha}</Text>

              <ScrollView>
                <Text style={styles.labelForm}>Nota del Folio (Editable):</Text>
                
                <TextInput 
                  style={[styles.inputAlargado, { height: 100, marginBottom: 20 }]}
                  multiline={true}
                  value={textoFolioEditable}
                  onChangeText={setTextoFolioEditable}
                />

                <TouchableOpacity 
                  style={styles.botonGuardarMini} 
                  onPress={actualizarNotaFolio}
                >
                  <Text style={styles.textoBotonGuardar}>Guardar Cambios en Nota</Text>
                </TouchableOpacity>

                <Text style={[styles.labelForm, { marginTop: 20 }]}>Fotos y Bocetos Adjuntos ({tareaSeleccionada.fotos?.length || 0}):</Text>
                {tareaSeleccionada.fotos && tareaSeleccionada.fotos.length > 0 ? (
                  tareaSeleccionada.fotos.map((fotoUri, index) => (
                    <View key={index} style={styles.marcoFotoAdjunta}>
                      <Image source={{ uri: fotoUri }} style={styles.imagenAdjunta} />
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: 10 }}>No hay archivos pegados en este folio todavía.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {pantallaActiva === 'Bocetos' && (
          <BocetosScreen alGuardarBoceto={guardarBocetoEnGaleriaGlobal} tareasConFolio={tareas.filter(t => t.hojaAdjunta) as any} alAdjuntarBoceto={adjuntarFotoATarea} />
        )}
        
        {pantallaActiva === 'Fotos' && (
          <FotosScreen alGuardarFoto={guardarFotoEnGaleriaGlobal} tareasConFolio={tareas.filter(t => t.hojaAdjunta) as any} alAdjuntarFoto={adjuntarFotoATarea} />
        )}

        {pantallaActiva === 'Base' && (
          <BaseScreen datos={datosBase as any} alAgregar={agregarABase} alEliminar={eliminarDeBase} />
        )}
        
        {pantallaActiva === 'Galeria' && (
          <GaleriaScreen elementos={elementosGaleria} setElementos={setElementosGaleria} tareasConFolio={tareas.filter(t => t.hojaAdjunta) as any} alAdjuntarFoto={adjuntarFotoATarea} />
        )}
      </View>

      <View style={styles.barraNavegacion}>
        <TouchableOpacity style={[styles.btnNav, { backgroundColor: '#fef08a' }, pantallaActiva === 'Agenda' && styles.btnNavActivo]} onPress={() => { setPantallaActiva('Agenda'); setModoAgenda('lista'); }}><Text style={styles.textoNav}>Agenda</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btnNav, { backgroundColor: '#bbf7d0' }, pantallaActiva === 'Bocetos' && styles.btnNavActivo]} onPress={() => setPantallaActiva('Bocetos')}><Text style={styles.textoNav}>Bocetos</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btnNav, { backgroundColor: '#bae6fd' }, pantallaActiva === 'Fotos' && styles.btnNavActivo]} onPress={() => setPantallaActiva('Fotos')}><Text style={styles.textoNav}>Fotos</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btnNav, { backgroundColor: '#fecdd3' }, pantallaActiva === 'Base' && styles.btnNavActivo]} onPress={() => setPantallaActiva('Base')}><Text style={styles.textoNav}>Base</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btnNav, { backgroundColor: '#e9d5ff' }, pantallaActiva === 'Galeria' && styles.btnNavActivo]} onPress={() => setPantallaActiva('Galeria')}><Text style={styles.textoNav}>Galería</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: '#f8fafc' },
  zonaContenido: { flex: 1 },
  contenedor: { flex: 1, padding: 15 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  titulo: { fontSize: 26, fontWeight: 'bold', flex: 1, color: '#1e293b' },
  grupoBotonesCabecera: { flexDirection: 'row' },
  botonCabecera: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginLeft: 10, elevation: 2 },
  textoBtnCab: { fontSize: 16, fontWeight: '600' },
  filaSubtitulo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  subtitulo: { fontSize: 18, marginRight: 12, fontWeight: '600', color: '#334155' },
  botonMas: { backgroundColor: '#38bdf8', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 2 },
  textoBotonMas: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: -2 },
  contadorCaja: { borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'white' },
  textoContador: { fontSize: 13, color: '#475569' },
  cajaTareas: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: 'white', borderRadius: 12, padding: 12, elevation: 2 },
  cabeceraLista: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 8, marginBottom: 10 },
  filaTarea: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 12 },
  grupoBotonesAccion: { flexDirection: 'row', width: 95, justifyContent: 'space-between', marginRight: 8 },
  botonAccion: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: 6, elevation: 1 },
  iconoAccion: { fontSize: 12 },
  espacioBotones: { width: 100 },
  columnaTitulo: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1e293b' },
  textoTachado: { textDecorationLine: 'line-through', color: '#94a3b8' },
  columnaDatos: { width: 60, fontSize: 13, textAlign: 'center', color: '#64748b' },
  filaBotonesBoceto: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cuadraditoBoceto: { flex: 1, height: 65, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginHorizontal: 3, elevation: 2 },
  iconoCuadradito: { fontSize: 18, marginBottom: 2 },
  textoCuadradito: { fontSize: 11, fontWeight: 'bold', color: '#334155', textAlign: 'center', paddingHorizontal: 2 },
  
  selectorHorasCaja: { backgroundColor: 'white', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 8, marginBottom: 10 },
  horaChip: { width: '22%', paddingVertical: 6, margin: '1.5%', backgroundColor: '#f1f5f9', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  horaChipSeleccionada: { backgroundColor: '#0284c7', borderColor: '#0369a1' },
  horaChipTexto: { fontSize: 12, fontWeight: 'bold', color: '#334155' },

  cajaAlargadaContenedor: { flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 12, elevation: 2 },
  cabeceraCajaNota: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelForm: { fontSize: 13, fontWeight: '600', color: '#334155' },
  botonMasHoja: { backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  textoBotonMasHoja: { fontSize: 11, fontWeight: 'bold', color: '#1e293b' },
  inputAlargado: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#f8fafc', color: '#1e293b' },
  
  botonBasePredef: { backgroundColor: '#e0f2fe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#38bdf8' },
  textoBotonMaps: { fontSize: 11, fontWeight: 'bold', color: '#0369a1' },
  
  botonMapsAbajo: { backgroundColor: '#e0f2fe', height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#38bdf8', elevation: 1 },
  textoBotonMapsGrande: { fontSize: 13, fontWeight: 'bold', color: '#0369a1' },

  calendarioCajaContenedor: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', padding: 12, elevation: 2 },
  calendarioNavegacionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  calendarioFlechaBtn: { padding: 6, backgroundColor: '#f1f5f9', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  calendarioFlechaTexto: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  calendarioMesTitulo: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  calendarioSeleccionTexto: { fontSize: 12, color: '#64748b', marginBottom: 6, textAlign: 'center' },
  
  calendarioDiasSemanaRow: { flexDirection: 'row', width: '100%', marginBottom: 4, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  calendarioDiaSemanaHeader: { width: '14.28%', textAlign: 'center', fontWeight: 'bold', color: '#64748b', fontSize: 12 },
  
  calendarioDiasGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  calendarioDiaVacio: { width: '14.28%', height: 32, padding: 1 },
  calendarioDiaItem: { width: '14.28%', height: 32, padding: 1, borderRadius: 4, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  calendarioDiaHoy: { backgroundColor: '#ef4444', borderColor: '#dc2626' }, 
  calendarioDiaSeleccionado: { backgroundColor: '#0284c7', borderColor: '#0369a1' }, 
  calendarioDiaTexto: { fontSize: 12, fontWeight: 'bold', color: '#334155' },

  calendarioDesplegableCaja: { marginTop: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 6 },
  calendarioDesplegableTitulo: { fontSize: 11, fontWeight: 'bold', color: '#0284c7', marginBottom: 3 },
  calendarioDesplegableItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },

  calcDisplayCaja: { backgroundColor: '#1e293b', borderRadius: 12, padding: 15, marginBottom: 12, alignItems: 'flex-end', elevation: 3 },
  calcDisplayText: { fontSize: 32, fontWeight: 'bold', color: '#f8fafc' },
  calcBotonera: { marginBottom: 10 },
  calcFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  calcBtn: { flex: 1, height: 50, marginHorizontal: 3, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 },
  calcBtnGrande: { flex: 2.15, height: 50, marginHorizontal: 3, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', elevation: 3 },
  calcBtnTexto: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  calcBtnTextoRojo: { fontSize: 18, fontWeight: 'bold', color: '#e11d48' },
  calcBtnTextoAzul: { fontSize: 18, fontWeight: 'bold', color: '#0284c7' },
  calcBtnTextoVerde: { fontSize: 18, fontWeight: 'bold', color: '#166534' },
  calcHistorialCaja: { height: 110, backgroundColor: 'white', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 8, elevation: 1 },
  calcHistorialItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  calcHistorialTexto: { fontSize: 13, color: '#334155', fontWeight: '600' },
  calcHistorialFecha: { fontSize: 10, color: '#94a3b8' },

  botonGuardarPequenoArriba: { backgroundColor: '#bbf7d0', height: 38, paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#86efac', elevation: 1 },
  textoBotonGuardarPequeno: { color: '#166534', fontSize: 14, fontWeight: 'bold' },

  botonGuardarAlargado: { backgroundColor: '#bbf7d0', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#86efac', elevation: 2 },
  botonGuardarMini: { backgroundColor: '#bbf7d0', height: 36, paddingHorizontal: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: '#86efac', elevation: 1 },
  textoBotonGuardar: { color: '#166534', fontSize: 14, fontWeight: 'bold' },
  barraNavegacion: { flexDirection: 'row', height: 75, paddingHorizontal: 6, paddingVertical: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e2e8f0', justifyContent: 'space-between', alignItems: 'center', elevation: 5 },
  btnNav: { flex: 1, marginHorizontal: 3, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 10, elevation: 3 },
  btnNavActivo: { borderWidth: 2.5, borderColor: '#0f172a' },
  textoNav: { fontSize: 11, color: '#1e293b', fontWeight: 'bold' },
  marcoFotoAdjunta: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, overflow: 'hidden', marginBottom: 15, backgroundColor: '#f8fafc' },
  imagenAdjunta: { width: '100%', height: 300, resizeMode: 'contain' },
  botonIconoFolio: { paddingHorizontal: 4, paddingVertical: 2, marginLeft: 2 }
});