/* ======================= Idioma: Português, English, Español =======================
   O app é escrito em português. Com outro idioma escolhido (Ajustes › Idioma ou na capa), os textos fixos da
   interface são trocados na tela por uma tabela (IDI_TAB: português ¦ inglês ¦ espanhol) e por padrões para os
   textos montados ("em 5 min", "Linha 1 · sentido Gráfica"). Nomes de lugares, linhas e destinos ficam como são.
   O que não está na tabela continua em português. Em português nada disto roda. Guardado em CFG.idioma.
   Para traduzir mais um texto: acrescente uma linha em IDI_TAB com o texto exatamente como aparece na tela. */
var IDI_NOMES={pt:'Português',en:'English',es:'Español'};
/* No site, a tabela (este texto, o de 37-idioma-textos.js e IDI_FRAG de 38-idioma-frases.js) sai do app.js para idioma.json
   (tools/build_site.py põe o endereço em IDI_ARQ): quem usa o app em português não baixa as traduções. */
var IDI_ARQ='';
var IDI_TAB=`
Ajustes ¦ Settings ¦ Ajustes
Siglas ¦ Acronyms ¦ Siglas
Voltar ¦ Back ¦ Volver
← Voltar ¦ ← Back ¦ ← Volver
Login ¦ Login ¦ Acceso
App ¦ App ¦ App
Capa ¦ Cover ¦ Portada
Gestão ¦ Admin ¦ Gestión
UFRJ · Ilha do Fundão ¦ UFRJ · Fundão Island ¦ UFRJ · Isla de Fundão
Para onde você vai hoje? ¦ Where are you going today? ¦ ¿A dónde vas hoy?
Abrir o mapa ¦ Open the map ¦ Abrir el mapa
Mapa ¦ Map ¦ Mapa
Ônibus ¦ Buses ¦ Autobuses
Grade ¦ Timetable ¦ Horario
Datas ¦ Dates ¦ Fechas
Noite ¦ Night ¦ Noche
Trajetos ¦ Routes ¦ Trayectos
Lugares ¦ Places ¦ Lugares
Calendário ¦ Calendar ¦ Calendario
Que bom te ver de novo ¦ Good to see you again ¦ Qué bueno verte de nuevo
Usar código ¦ Use code ¦ Usar código
Entrar ¦ Sign in ¦ Entrar
Entrar com Google ¦ Sign in with Google ¦ Entrar con Google
Entrar com e-mail ¦ Sign in with e-mail ¦ Entrar con correo
Não é você? ¦ Not you? ¦ ¿No eres tú?
Trocar de conta ¦ Switch account ¦ Cambiar de cuenta
Primeiro acesso ¦ First time here ¦ Primer acceso
Crie seu perfil ¦ Create your profile ¦ Crea tu perfil
Fica salvo só neste aparelho. Da próxima vez, é só tocar para entrar. ¦ It is saved only on this device. Next time, just tap to enter. ¦ Se guarda solo en este dispositivo. La próxima vez, basta tocar para entrar.
Como você quer ser chamado? ¦ What should we call you? ¦ ¿Cómo quieres que te llamemos?
Código de 4 dígitos ¦ 4-digit code ¦ Código de 4 dígitos
Código de 4 dígitos (opcional) ¦ 4-digit code (optional) ¦ Código de 4 dígitos (opcional)
Criar perfil e entrar ¦ Create profile and enter ¦ Crear perfil y entrar
Entrar sem perfil (só consultar) ¦ Enter without a profile (view only) ¦ Entrar sin perfil (solo consultar)
Criar perfil ¦ Create profile ¦ Crear perfil
Criar conta ¦ Create account ¦ Crear cuenta
Já tenho conta ¦ I have an account ¦ Ya tengo cuenta
E-mail ¦ E-mail ¦ Correo
Senha ¦ Password ¦ Contraseña
Esqueci a senha ¦ Forgot my password ¦ Olvidé la contraseña
Sair ¦ Sign out ¦ Salir
Tiroteios perto das saídas ¦ Shootings near the exits ¦ Tiroteos cerca de las salidas
Evite a região se puder. ¦ Avoid the area if you can. ¦ Evita la zona si puedes.
Evite a região se puder. Toque para ver. Fonte: Fogo Cruzado. ¦ Avoid the area if you can. Tap to see. Source: Fogo Cruzado. ¦ Evita la zona si puedes. Toca para ver. Fuente: Fogo Cruzado.
Fonte: Fogo Cruzado. Não é alerta oficial. Emergência: 190. ¦ Source: Fogo Cruzado. Not an official alert. Emergency: 190. ¦ Fuente: Fogo Cruzado. No es una alerta oficial. Emergencia: 190.
Ver detalhes ¦ See details ¦ Ver detalles
Ocultar este alerta ¦ Hide this alert ¦ Ocultar esta alerta
Ativar notificações ¦ Turn on notifications ¦ Activar notificaciones
Aviso no celular quando houver tiroteio perto das saídas da ilha. ¦ A phone alert when there is a shooting near the island exits. ¦ Aviso en el móvil cuando haya un tiroteo cerca de las salidas de la isla.
Notificações ligadas ¦ Notifications on ¦ Notificaciones activadas
Você recebe um aviso quando há tiroteio novo perto do Fundão. ¦ You get an alert when there is a new shooting near Fundão. ¦ Recibes un aviso cuando hay un tiroteo nuevo cerca de Fundão.
Receba avisos de tiroteio ¦ Get shooting alerts ¦ Recibe avisos de tiroteo
No iPhone, instale o app na Tela de Início. Toque para ver como. ¦ On iPhone, add the app to the Home Screen. Tap to see how. ¦ En iPhone, instala la app en la pantalla de inicio. Toca para ver cómo.
Previsão indisponível ¦ Forecast unavailable ¦ Pronóstico no disponible
Não deu para falar com o serviço de previsão agora. ¦ Could not reach the forecast service right now. ¦ No se pudo conectar con el servicio de pronóstico ahora.
Tentar de novo ¦ Try again ¦ Reintentar
aberto ¦ open ¦ abierto
Wi-Fi aberto ¦ Open Wi-Fi ¦ Wi-Fi abierto
Serviços ¦ Services ¦ Servicios
Todos ¦ All ¦ Todos
Comer ¦ Food ¦ Comer
Banco ¦ Bank ¦ Banco
Saúde ¦ Health ¦ Salud
Papelaria e correio ¦ Stationery and post ¦ Papelería y correo
Táxi e bicicleta ¦ Taxi and bikes ¦ Taxi y bicicleta
Buscar ônibus ¦ Find a bus ¦ Buscar autobús
Ruas ao redor: ¦ Surrounding streets: ¦ Calles alrededor:
colaboradores do ¦ contributors ¦ colaboradores de
Legenda ¦ Legend ¦ Leyenda
Parada ¦ Stop ¦ Parada
Parada selecionada ¦ Selected stop ¦ Parada seleccionada
Parada de várias linhas ¦ Stop served by several lines ¦ Parada de varias líneas
Wi-Fi aberto (mais barras, sinal melhor) ¦ Open Wi-Fi (more bars, better signal) ¦ Wi-Fi abierto (más barras, mejor señal)
Guarita (segurança) ¦ Guard post (security) ¦ Garita (seguridad)
Aviso de aluno ¦ Student report ¦ Aviso de estudiante
Você (localização) ¦ You (location) ¦ Tú (ubicación)
Rosa dos ventos: orientação aproximada ¦ Compass rose: approximate orientation ¦ Rosa de los vientos: orientación aproximada
Ônibus ao vivo: número da linha; a ponta mostra o sentido ¦ Live bus: line number; the tip shows the direction ¦ Autobús en vivo: número de línea; la punta muestra el sentido
Ônibus que você está seguindo ¦ Bus you are following ¦ Autobús que estás siguiendo
Linha sem horários no app ¦ Line with no timetable in the app ¦ Línea sin horarios en la app
Ponto de ônibus da cidade ¦ City bus stop ¦ Parada de autobús de la ciudad
Anel verde na bússola: posições chegando ¦ Green ring on the compass: positions arriving ¦ Anillo verde en la brújula: posiciones llegando
Laranja: chegando com atraso ¦ Orange: arriving late ¦ Naranja: llegando con retraso
Vermelho: ao vivo parado ¦ Red: live data stopped ¦ Rojo: en vivo detenido
Entre uma posição e outra, o ônibus avança pela velocidade (estimativa) ¦ Between positions, the bus moves by its speed (estimate) ¦ Entre una posición y otra, el autobús avanza según su velocidad (estimación)
Arraste para mover · pinça para zoom ¦ Drag to move · pinch to zoom ¦ Arrastra para mover · pellizca para ampliar
Planta: ETU/UFRJ (levantamento cadastral) ¦ Site plan: ETU/UFRJ (cadastral survey) ¦ Plano: ETU/UFRJ (levantamiento catastral)
Linhas internas da UFRJ ¦ UFRJ campus bus lines ¦ Líneas internas de la UFRJ
Seu trajeto ¦ Your route ¦ Tu trayecto
De ¦ From ¦ Desde
Para ¦ To ¦ Hasta
passa até ¦ passes within ¦ pasa en hasta
agora ¦ now ¦ ahora
mais provável no meio ¦ most likely in the middle ¦ más probable en el medio
Embarque em ¦ Board at ¦ Sube en
entre ¦ between ¦ entre
Depois ¦ Later ¦ Después
Outras linhas ¦ Other lines ¦ Otras líneas
Outras ¦ Others ¦ Otras
Avisar alguém ¦ Tell someone ¦ Avisar a alguien
Mensagem pronta com o ônibus e a hora de chegada ¦ Ready-made message with the bus and arrival time ¦ Mensaje listo con el autobús y la hora de llegada
Estou saindo ¦ I'm leaving ¦ Estoy saliendo
Cheguei ¦ I've arrived ¦ Llegué
Ônibus atrasou ¦ Bus is late ¦ El autobús se retrasó
Copiar mensagem ¦ Copy message ¦ Copiar mensaje
Abrir no WhatsApp ¦ Open in WhatsApp ¦ Abrir en WhatsApp
Copiar ¦ Copy ¦ Copiar
Volta à noite ¦ Getting back at night ¦ Vuelta de noche
Último ônibus, guaritas e telefone da segurança ¦ Last bus, guard posts and security phone numbers ¦ Último autobús, garitas y teléfono de seguridad
Wi-Fi aberto perto do destino ¦ Open Wi-Fi near your destination ¦ Wi-Fi abierto cerca del destino
Como chegar à Ilha do Fundão ¦ How to get to Fundão Island ¦ Cómo llegar a la Isla de Fundão
Metrô ¦ Metro ¦ Metro
Desça na estação Fundão – Cidade Universitária e pegue a linha interna na Estação de Integração. ¦ Get off at Fundão – Cidade Universitária station and take the campus bus at the Integration Station. ¦ Baja en la estación Fundão – Cidade Universitária y toma la línea interna en la Estación de Integración.
Ônibus da cidade ¦ City buses ¦ Autobuses de la ciudad
Ao vivo: ¦ Live: ¦ En vivo:
ao vivo ¦ live ¦ en vivo
Centro ¦ Downtown ¦ Centro
Zona Sul ¦ South Zone ¦ Zona Sur
Zona Norte ¦ North Zone ¦ Zona Norte
Zona Oeste ¦ West Zone ¦ Zona Oeste
Outros destinos ¦ Other destinations ¦ Otros destinos
sem mais saídas hoje ¦ no more departures today ¦ sin más salidas hoy
Destino ¦ Destination ¦ Destino
Avisos dos alunos ¦ Student reports ¦ Avisos de estudiantes
Ao vivo · últimas 4 horas ¦ Live · last 4 hours ¦ En vivo · últimas 4 horas
Nenhum aviso agora. Viu fila grande no RU, ônibus lotado ou Wi-Fi fora do ar? Avise os colegas. ¦ No reports right now. Seen a long queue at the cafeteria, a packed bus or Wi-Fi down? Tell your colleagues. ¦ Ningún aviso ahora. ¿Viste una fila larga en el comedor, un autobús lleno o el Wi-Fi caído? Avisa a tus compañeros.
Crie seu perfil para enviar avisos. ¦ Create your profile to send reports. ¦ Crea tu perfil para enviar avisos.
Sem perfil, o app só mostra as informações. ¦ Without a profile, the app only shows information. ¦ Sin perfil, la app solo muestra la información.
Guia de prédios ¦ Building guide ¦ Guía de edificios
Institutos, bibliotecas e horários de funcionamento ¦ Institutes, libraries and opening hours ¦ Institutos, bibliotecas y horarios
Transporte integrado ¦ Campus transport ¦ Transporte integrado
Linhas internas ¦ Campus lines ¦ Líneas internas
Toque numa linha para ver o itinerário, ou numa parada do mapa para ver os próximos horários. ¦ Tap a line to see its route, or a stop on the map to see the next departures. ¦ Toca una línea para ver el recorrido, o una parada del mapa para ver los próximos horarios.
Sobre o protótipo e as fontes ¦ About the prototype and sources ¦ Sobre el prototipo y las fuentes
Linha, destino ou número do carro ¦ Line, destination or bus number ¦ Línea, destino o número del coche
Linha, destino ou carro ¦ Line, destination or bus ¦ Línea, destino o coche
Digite a linha para ver os outros. ¦ Type the line to see the others. ¦ Escribe la línea para ver los demás.
Só aparecem os ônibus da cidade na região do Fundão. ¦ Only city buses around Fundão are shown. ¦ Solo aparecen los autobuses de la ciudad en la zona de Fundão.
Fechar a busca ¦ Close search ¦ Cerrar la búsqueda
Sem horários no app · ¦ No timetable in the app · ¦ Sin horarios en la app ·
Parar de seguir ¦ Stop following ¦ Dejar de seguir
Voltar ao ônibus ¦ Back to the bus ¦ Volver al autobús
Chegando agora ¦ Arriving now ¦ Llegando ahora
chegando ¦ arriving ¦ llegando
menos de 1 min ¦ less than 1 min ¦ menos de 1 min
Seguir ¦ Follow ¦ Seguir
Nenhum ônibus ao vivo vindo para este ponto agora. ¦ No live bus heading to this stop right now. ¦ Ningún autobús en vivo viene hacia esta parada ahora.
Tempo estimado pela posição e velocidade do ônibus. Pode variar com o trânsito. ¦ Time estimated from the bus position and speed. It may vary with traffic. ¦ Tiempo estimado por la posición y velocidad del autobús. Puede variar con el tráfico.
Buscando ônibus ao vivo… ¦ Looking for live buses… ¦ Buscando autobuses en vivo…
Sair daqui ¦ Leave from here ¦ Salir de aquí
Ir para cá ¦ Go here ¦ Ir aquí
Wi-Fi aberto por perto ¦ Open Wi-Fi nearby ¦ Wi-Fi abierto cerca
Sugerir correção ¦ Suggest a correction ¦ Sugerir corrección
Ônibus da cidade nesta parada ¦ City buses at this stop ¦ Autobuses de la ciudad en esta parada
← Todas as linhas ¦ ← All lines ¦ ← Todas las líneas
Segurança ¦ Safety ¦ Seguridad
Onde você está? ¦ Where are you? ¦ ¿Dónde estás?
Você já está na Estação BRT. ¦ You are already at the BRT Station. ¦ Ya estás en la Estación BRT.
Daqui saem o BRT e os ônibus para fora da ilha. ¦ The BRT and buses off the island leave from here. ¦ De aquí salen el BRT y los autobuses hacia fuera de la isla.
Você já está no ponto mais perto da Vila Residencial. ¦ You are already at the stop closest to Vila Residencial. ¦ Ya estás en la parada más cercana a la Vila Residencial.
Último horário de cada linha aqui ¦ Last departure of each line here ¦ Último horario de cada línea aquí
Ainda há tempo ¦ Still time ¦ Aún hay tiempo
Encerrado ¦ Ended ¦ Terminado
Avise alguém de confiança ¦ Tell someone you trust ¦ Avisa a alguien de confianza
Telefones da segurança ¦ Security phone numbers ¦ Teléfonos de seguridad
Polícia Militar ¦ Military Police ¦ Policía Militar
Em caso de violência ¦ In case of violence ¦ En caso de violencia
Salve esses números no celular antes de precisar. Se a ligação não abrir pelo botão, copie o número. ¦ Save these numbers on your phone before you need them. If the call does not open from the button, copy the number. ¦ Guarda estos números en el móvil antes de necesitarlos. Si la llamada no se abre con el botón, copia el número.
Guaritas ¦ Guard posts ¦ Garitas
Dicas da Prefeitura Universitária ¦ Tips from the Campus Administration ¦ Consejos de la Prefectura Universitaria
Evite chegar ou sair do campus sozinho tarde da noite; combine de ir junto com colegas. ¦ Avoid arriving at or leaving campus alone late at night; arrange to go with colleagues. ¦ Evita llegar o salir del campus solo de noche; ponte de acuerdo para ir con compañeros.
Espere o ônibus em ponto movimentado e iluminado, sem deixar o celular à mostra. ¦ Wait for the bus at a busy, well-lit stop, keeping your phone out of sight. ¦ Espera el autobús en una parada concurrida e iluminada, sin dejar el móvil a la vista.
Hoje vou sair da ilha: ver a volta para a Estação BRT ¦ I'm leaving the island today: show the way back to the BRT Station ¦ Hoy salgo de la isla: ver la vuelta a la Estación BRT
Ver a volta para a Vila Residencial ¦ Show the way back to Vila Residencial ¦ Ver la vuelta a la Vila Residencial
Minha grade ¦ My timetable ¦ Mi horario
Próxima aula ¦ Next class ¦ Próxima clase
Semana ¦ Week ¦ Semana
Segunda ¦ Monday ¦ Lunes
Terça ¦ Tuesday ¦ Martes
Quarta ¦ Wednesday ¦ Miércoles
Quinta ¦ Thursday ¦ Jueves
Sexta ¦ Friday ¦ Viernes
Adicionar aula ¦ Add class ¦ Añadir clase
Salvar aula ¦ Save class ¦ Guardar clase
Disciplina ¦ Course ¦ Asignatura
Prédio ¦ Building ¦ Edificio
Sala ¦ Room ¦ Aula
Dias ¦ Days ¦ Días
Início ¦ Start ¦ Inicio
Fim ¦ End ¦ Fin
Calendário acadêmico ¦ Academic calendar ¦ Calendario académico
Próximos prazos ¦ Upcoming deadlines ¦ Próximos plazos
Próximos feriados ¦ Upcoming holidays ¦ Próximos feriados
Fila do RU agora ¦ Cafeteria queue now ¦ Fila del comedor ahora
Configurar eduroam ¦ Set up eduroam ¦ Configurar eduroam
Ver tutorial ¦ See tutorial ¦ Ver tutorial
Aparência ¦ Appearance ¦ Apariencia
Mapa, avisos e perfil ¦ Map, alerts and profile ¦ Mapa, avisos y perfil
Tema ¦ Theme ¦ Tema
Sempre escuro ¦ Always dark ¦ Siempre oscuro
Sempre claro ¦ Always light ¦ Siempre claro
Do aparelho ¦ Device setting ¦ Del dispositivo
Pelo horário ¦ By time of day ¦ Según la hora
Plano de fundo ¦ Background ¦ Fondo
Fonte ¦ Font ¦ Fuente
Tamanho do texto ¦ Text size ¦ Tamaño del texto
Pequeno ¦ Small ¦ Pequeño
Normal ¦ Normal ¦ Normal
Grande ¦ Large ¦ Grande
Muito grande ¦ Very large ¦ Muy grande
Desempenho ¦ Performance ¦ Rendimiento
Automático ¦ Automatic ¦ Automático
Leve ¦ Light ¦ Ligero
Intermediário ¦ Balanced ¦ Intermedio
Completo ¦ Full ¦ Completo
Conta ¦ Account ¦ Cuenta
Alertas ¦ Alerts ¦ Alertas
Segurança no caminho ¦ Safety on the way ¦ Seguridad en el camino
Tiroteios perto das saídas do Fundão ¦ Shootings near the Fundão exits ¦ Tiroteos cerca de las salidas de Fundão
Notificar tiroteios novos ¦ Notify me of new shootings ¦ Notificar tiroteos nuevos
Avisa no celular quando o Fogo Cruzado registra tiroteio perto das saídas da ilha, mesmo com o app fechado. ¦ Alerts your phone when Fogo Cruzado reports a shooting near the island exits, even with the app closed. ¦ Avisa en el móvil cuando Fogo Cruzado registra un tiroteo cerca de las salidas de la isla, incluso con la app cerrada.
Mandar um teste ¦ Send a test ¦ Enviar una prueba
Fale com a gente ¦ Talk to us ¦ Habla con nosotros
Instalar o app ¦ Install the app ¦ Instalar la app
Ver o passo a passo ¦ See the steps ¦ Ver el paso a paso
Rede e Wi-Fi ¦ Network and Wi-Fi ¦ Red y Wi-Fi
Simular horário ¦ Simulate time ¦ Simular hora
Agora ¦ Now ¦ Ahora
Avisos e notificações ¦ Alerts and notifications ¦ Avisos y notificaciones
Perfil ¦ Profile ¦ Perfil
Nenhum perfil salvo neste aparelho. ¦ No profile saved on this device. ¦ Ningún perfil guardado en este dispositivo.
Os ajustes ficam salvos neste aparelho. ¦ Settings are saved on this device. ¦ Los ajustes se guardan en este dispositivo.
Tela e navegação ¦ Screen and navigation ¦ Pantalla y navegación
Modo simplificado ¦ Simplified mode ¦ Modo simplificado
Horário dos ônibus ¦ Bus times ¦ Horario de autobuses
Previsão do tempo ¦ Weather forecast ¦ Pronóstico del tiempo
Abas do app ¦ App tabs ¦ Pestañas de la app
Mostrar ¦ Show ¦ Mostrar
Idioma ¦ Language ¦ Idioma
Os nomes de lugares e linhas ficam em português. Alguns textos ainda não foram traduzidos. ¦ Place and line names stay in Portuguese. Some texts are not translated yet. ¦ Los nombres de lugares y líneas quedan en portugués. Algunos textos aún no están traducidos.
Como você usa o Fundão? ¦ How do you use Fundão? ¦ ¿Cómo usas Fundão?
Como você usa o Fundão ¦ How you use Fundão ¦ Cómo usas Fundão
Para o app mostrar o que serve para você. Marque o que valer. ¦ So the app shows what is useful to you. Tick all that apply. ¦ Para que la app muestre lo que te sirve. Marca lo que corresponda.
Estudo na UFRJ ¦ I study at UFRJ ¦ Estudio en la UFRJ
Moro na Vila Residencial ¦ I live in Vila Residencial ¦ Vivo en la Vila Residencial
Trabalho no Fundão ¦ I work at Fundão ¦ Trabajo en Fundão
Sou paciente ou visitante ¦ I'm a patient or visitor ¦ Soy paciente o visitante
Mostrar a aba Grade ¦ Show the Timetable tab ¦ Mostrar la pestaña Horario
Seu horário de aulas, com o ônibus de cada uma. ¦ Your class schedule, with the bus for each one. ¦ Tu horario de clases, con el autobús de cada una.
Agora não ¦ Not now ¦ Ahora no
Salvar ¦ Save ¦ Guardar
Mudar ¦ Change ¦ Cambiar
Responder ¦ Answer ¦ Responder
Ainda não informado ¦ Not answered yet ¦ Aún sin responder
Instale o Chega aí ¦ Install Chega aí ¦ Instala Chega aí
Ícone na tela inicial, tela cheia e funciona mesmo sem internet. ¦ Home screen icon, full screen, and it works even offline. ¦ Icono en la pantalla de inicio, pantalla completa y funciona incluso sin internet.
Não mostrar mais ¦ Don't show again ¦ No mostrar más
Instalar o app ¦ Install the app ¦ Instalar la app
Fechar ajustes ¦ Close settings ¦ Cerrar ajustes
Aproximar ¦ Zoom in ¦ Acercar
Afastar ¦ Zoom out ¦ Alejar
Onde estou ¦ Where I am ¦ Dónde estoy
Mostrar onde estou ¦ Show where I am ¦ Mostrar dónde estoy
Ver o campus inteiro ¦ See the whole campus ¦ Ver todo el campus
Busque ponto, prédio ou sigla ¦ Search stop, building or acronym ¦ Busca parada, edificio o sigla
Inverter origem e destino ¦ Swap origin and destination ¦ Invertir origen y destino
Ônibus gratuitos da UFRJ, paradas e trajetos ¦ Free UFRJ buses, stops and routes ¦ Autobuses gratuitos de la UFRJ, paradas y trayectos
Linhas municipais e BRT, com posição ao vivo ¦ City lines and BRT, with live position ¦ Líneas municipales y BRT, con posición en vivo
`;
/* textos montados: [padrão sobre o texto em português, inglês, espanhol]; $1, $2… são os trechos que ficam como vieram */
var IDI_PAD=[
  [/^Linha (\S+) · sentido (.+)$/,'Line $1 · towards $2','Línea $1 · sentido $2'],
  [/^Linha (\S+) · (.+)$/,'Line $1 · $2','Línea $1 · $2'],
  [/^Linha (\S+)$/,'Line $1','Línea $1'],
  [/^Sentido (.+)$/,'Towards $1','Sentido $1'],
  [/^em (\d+(?:–\d+)?) min$/,'in $1 min','en $1 min'],
  [/^até (\d+) min$/,'up to $1 min','hasta $1 min'],
  [/^há (\d+) (s|min|h)$/,'$1 $2 ago','hace $1 $2'],
  [/^(\d+) ao vivo$/,'$1 live','$1 en vivo'],
  [/^(\d+) ônibus ao vivo$/,'$1 live buses','$1 autobuses en vivo'],
  [/^Carro (\S+) · parado · há (.+)$/,'Bus $1 · stopped · $2 ago','Coche $1 · parado · hace $2'],
  [/^Carro (\S+) · (\d+) km\/h · há (.+)$/,'Bus $1 · $2 km/h · $3 ago','Coche $1 · $2 km/h · hace $3'],
  [/^chega (\d\d:\d\d)$/,'arrives $1','llega $1'],
  [/^Faltam (\d+) min$/,'$1 min left','Faltan $1 min'],
  [/^· cerca de (\d+) min$/,'· about $1 min','· unos $1 min'],
  [/^· depois (.+)$/,'· then $1','· luego $1'],
  [/^Tiroteio há (.+?) em (.+)$/,'Shooting $1 ago in $2','Tiroteo hace $1 en $2'],
  [/^Teve tiroteio há (.+?) em (.+)$/,'Shooting reported $1 ago in $2','Hubo un tiroteo hace $1 en $2'],
  [/^Tiroteio há (.+?) perto das saídas$/,'Shooting $1 ago near the exits','Tiroteo hace $1 cerca de las salidas'],
  [/^Teve tiroteio há (.+?) perto das saídas$/,'Shooting reported $1 ago near the exits','Hubo un tiroteo hace $1 cerca de las salidas'],
  [/^(\d+) registros? nas últimas (\d+) h · último há (.+)$/,'$1 report(s) in the last $2 h · latest $3 ago','$1 registro(s) en las últimas $2 h · último hace $3'],
  [/^Para (.+) · a (.+) · carro (\S+)$/,'To $1 · $2 away · bus $3','Hacia $1 · a $2 · coche $3'],
  [/^a (\d.+?) · carro (\S+)$/,'$1 away · bus $2','a $1 · coche $2'],
  [/^Próximo: (\S+) para (.+) agora$/,'Next: $1 to $2 now','Próximo: $1 hacia $2 ahora'],
  [/^Próximo: (\S+) para (.+) em (\d+) min$/,'Next: $1 to $2 in $3 min','Próximo: $1 hacia $2 en $3 min'],
  [/^(\d+) ônibus na região do Fundão · atualizado há (\d+ \w+).*$/,'$1 buses around Fundão · updated $2 ago','$1 autobuses en la zona de Fundão · actualizado hace $2'],
  [/^Em (\d+) dias$/,'In $1 days','En $1 días'],
  [/^Chega em (.+) entre$/,'Arrives at $1 between','Llega a $1 entre'],
  [/^Último ônibus daqui para a Estação BRT$/,'Last bus from here to the BRT Station','Último autobús desde aquí a la Estación BRT'],
  [/^Último ônibus daqui para a Vila Residencial \(ponto (.+)\)$/,'Last bus from here to Vila Residencial ($1 stop)','Último autobús desde aquí a la Vila Residencial (parada $1)'],
  [/^Seguir o ônibus (\S+), carro (\S+), no mapa$/,'Follow bus $1, vehicle $2, on the map','Seguir el autobús $1, coche $2, en el mapa']
];
var IDI={on:false,mapa:null,obs:null,feito:new WeakMap()},IDI_ATR=['aria-label','title','placeholder'];
function idiAtual(){return IDI_NOMES[CFG.idioma]?CFG.idioma:'pt'}
function idiMapa(){
  if(IDI.mapa)return IDI.mapa;var M=IDI.mapa=new Map();
  IDI_TAB.split('\n').forEach(function(l){var p=l.split('¦');if(p.length===3)M.set(p[0].trim(),[p[1].trim(),p[2].trim()])});return M;
}
/* tradução de um texto em português para o idioma atual (ou null se não há) */
function idiTraduz(t){
  var k=idiAtual()==='en'?0:1,r=idiMapa().get(t);if(r)return r[k];
  for(var i=0;i<IDI_PAD.length;i++){var P=IDI_PAD[i];if(P[0].test(t))return t.replace(P[0],P[1+k])}
  return typeof IDI_FRAG==='string'?idiPorPedacos(t):null;/* pedaços de frase: 38-idioma-frases.js */
}
function idiTexto(n){
  var v=n.nodeValue,f=IDI.feito.get(n);
  if(f&&f.tr===v){if(f.l===idiAtual())return;v=f.pt}/* já traduzido: parte do original (troca de idioma) */
  var t=v.replace(/\s+/g,' ').trim();if(t.length<2){return}
  if(idiAtual()==='pt'){if(f&&f.tr===n.nodeValue)n.nodeValue=f.pt;IDI.feito.delete(n);return}
  var r=idiTraduz(t);if(r==null)return;
  var novo=v.replace(/^(\s*)[\s\S]*?(\s*)$/,function(_,a,b){return a+r+b});
  IDI.feito.set(n,{pt:v,tr:novo,l:idiAtual()});if(n.nodeValue!==novo)n.nodeValue=novo;
}
function idiAtributos(e){
  for(var i=0;i<IDI_ATR.length;i++){var a=IDI_ATR[i],v=e.getAttribute(a);if(!v)continue;
    var g=e.__idi||(e.__idi={}),f=g[a];if(f&&f.tr===v){if(f.l===idiAtual())continue;v=f.pt}
    if(idiAtual()==='pt'){if(f){e.setAttribute(a,f.pt);delete g[a]}continue}
    var r=idiTraduz(v.replace(/\s+/g,' ').trim());if(r==null)continue;g[a]={pt:v,tr:r,l:idiAtual()};e.setAttribute(a,r)}
}
function idiFora(e){return !e||!e.closest||!!e.closest('script,style,#world,textarea,[contenteditable],[data-idi-nao]')}
function idiVarre(raiz){
  if(raiz.nodeType===3){if(!idiFora(raiz.parentElement))idiTexto(raiz);return}
  if(raiz.nodeType!==1||idiFora(raiz))return;
  var w=document.createTreeWalker(raiz,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT),n=raiz;
  while(n){if(n.nodeType===3){if(!idiFora(n.parentElement))idiTexto(n)}else if(n.hasAttribute&&(n.hasAttribute('aria-label')||n.hasAttribute('title')||n.hasAttribute('placeholder'))&&!idiFora(n))idiAtributos(n);n=w.nextNode()}
}
function idiPronto(){return !IDI_ARQ||!!IDI.carregado}
/* baixa as traduções (só na primeira vez que o idioma não é português) */
function idiCarrega(){
  if(idiPronto())return Promise.resolve();
  if(!IDI.baixando)IDI.baixando=fetch(IDI_ARQ).then(function(r){if(!r.ok)throw new Error('idioma');return r.json()}).then(function(j){
    IDI_TAB=j.tab+j.frag+IDI_TAB;IDI_FRAG=j.frag+IDI_FRAG;IDI.mapa=null;IDI_PEDACOS=null;IDI_CACHE.clear();IDI.carregado=true;IDI.baixando=null})
    .catch(function(){IDI.baixando=null});
  return IDI.baixando;
}
function idiLiga(){
  document.documentElement.lang=idiAtual()==='pt'?'pt-BR':idiAtual();
  if(idiAtual()!=='pt'&&!idiPronto()){idiCarrega().then(function(){if(idiPronto())idiLiga()});return}
  idiVarre(document.body);
  if(idiAtual()==='pt'){if(IDI.obs){IDI.obs.disconnect();IDI.obs=null}return}
  if(IDI.obs)return;
  IDI.obs=new MutationObserver(function(L){for(var i=0;i<L.length;i++){var m=L[i];
    if(m.type==='characterData')idiVarre(m.target);
    else if(m.type==='attributes'){if(!idiFora(m.target))idiAtributos(m.target)}
    else for(var j=0;j<m.addedNodes.length;j++)idiVarre(m.addedNodes[j])}});
  IDI.obs.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:IDI_ATR});
}
function idiEscolhe(l){if(!IDI_NOMES[l]||l===idiAtual())return;CFG.idioma=l;saveCfg();idiLiga();idiPinta()}
function idiBotoes(){return Object.keys(IDI_NOMES).map(function(l){return '<button type="button" data-idioma="'+l+'" lang="'+l+'" aria-pressed="'+(l===idiAtual())+'">'+IDI_NOMES[l]+'</button>'}).join('')}
function idiPinta(){document.querySelectorAll('[data-idioma]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.idioma===idiAtual()))})}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-idioma]');if(!b)return;
  var l=b.dataset.idioma,capa=!!b.closest('#cvIdioma');
  if(!CFG.idiomaOk){CFG.idiomaOk=true;if(l===idiAtual())saveCfg()}
  idiEscolhe(l);
  /* na capa: mostra a escolha um instante e some */
  if(capa){var c=$('#cvIdioma');if(c){c.classList.add('saindo');setTimeout(function(){var d=$('#cvIdioma');if(d)d.remove();if(typeof placeCoverMap==='function')placeCoverMap()},700)}}});
/* Ajustes: no começo da folha */
aoFazer('ajustes montados',function(){
  var r=$('#cfgR')||document.querySelector('#pane-cfg .cfgsheet');if(!r||r.querySelector('#idiSec'))return;
  r.insertAdjacentHTML('afterbegin','<div id="idiSec" class="idi-sec"><div><p class="eyebrow">Ajustes</p><h2>Idioma</h2></div>'+
    '<div class="seg chips" role="group" aria-label="Idioma" data-idi-nao>'+idiBotoes()+'</div>'+
    '<p class="muted small keep">Os nomes de lugares e linhas ficam em português. Alguns textos ainda não foram traduzidos.</p></div>');
});
/* capa: a escolha do idioma aparece só até a pessoa escolher uma vez (CFG.idiomaOk, guardado no aparelho e na conta) */
if(CFG.idioma&&CFG.idioma!=='pt')CFG.idiomaOk=true;/* quem já tinha trocado antes desta versão já escolheu */
function idiCapa(){
  var c=$('#cvIdioma');if(CFG.idiomaOk){if(c)c.remove();return}
  var s=document.querySelector('#cover .cv-sheet .eyebrow');if(s&&!c)s.insertAdjacentHTML('afterend','<div class="cv-idioma seg chips" id="cvIdioma" role="group" aria-label="Idioma / Language" data-idi-nao>'+idiBotoes()+'</div>');
}
idiCapa();
/* ajustes vindos da conta (outro aparelho): aplica o idioma e esconde a escolha da capa */
function idiAplica(){idiLiga();idiPinta();idiCapa()}
if(idiAtual()!=='pt')idiLiga();
