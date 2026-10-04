/** Formularlogik: Pflichtprüfung, Mailtext, Versand über PHP oder mailto. */
const EMAIL = 'mhuemmecke@gmx.de'
const MULTI = [
  'gebaeudeNutzung',
  'waermeabgabe',
  'waermeabgabeGeschoss_Heizkoerper',
  'waermeabgabeGeschoss_Fussboden',
  'waermeabgabeGeschoss_Wand',
  'sanierungMassnahmen',
  'beratungsziele',
  'unterlagenPlan',
  'unterlagenDetail',
  'unterlagenWeitere',
]

const SANIERUNG = [
  ['Dach', 'sanierungJahr_Dach', 'sanierungAngabe_Dach'],
  ['oberste Geschossdecke', 'sanierungJahr_OGD', 'sanierungAngabe_OGD'],
  ['Fenster / Haustüre', 'sanierungJahr_Fenster', 'sanierungAngabe_Fenster'],
  ['Fassade / Außenwand', 'sanierungJahr_Fassade', 'sanierungAngabe_Fassade'],
  ['Kellerdecke', 'sanierungJahr_Kellerdecke', 'sanierungAngabe_Kellerdecke'],
  ['Bodenplatte', 'sanierungJahr_Bodenplatte', 'sanierungAngabe_Bodenplatte'],
  ['Anlagentechnik (Heizung / WW)', 'sanierungJahr_Anlage', 'sanierungAngabe_Anlage'],
  ['Verteilleitungen', 'sanierungJahr_Verteil', 'sanierungAngabe_Verteil'],
  ['Pumpen / Regelung', 'sanierungJahr_Pumpen', 'sanierungAngabe_Pumpen'],
  ['Andere', 'sanierungJahr_Andere', 'sanierungAngabe_Andere'],
]

const form = document.getElementById('checkliste')

function fieldKey(name) {
  return name.endsWith('[]') ? name.slice(0, -2) : name
}

function dash(value) {
  return value && String(value).trim() ? value : '–'
}

function list(values) {
  return values && values.length ? values.join(', ') : '–'
}

function nutzer(data) {
  if (data.gebaeudeart === 'Mehrfamilienhaus') return dash(data.anzahlNutzerMfh)
  return dash(data.anzahlNutzer)
}

function numbered(data, prefix, count, second) {
  const lines = []
  for (let i = 1; i <= count; i += 1) {
    const first = data[`${prefix}_${i}`]
    const extra = second ? data[`${second}_${i}`] : ''
    if ((first && String(first).trim()) || (extra && String(extra).trim())) {
      lines.push(second ? `- ${dash(first)} | ${dash(extra)}` : `- ${dash(first)}`)
    }
  }
  return lines.length ? lines.join('\n') : '–'
}

function waermeZeilen(data) {
  const rows = [
    ['Heizkörper', 'waermeabgabeGeschoss_Heizkoerper'],
    ['Fußbodenheizung', 'waermeabgabeGeschoss_Fussboden'],
    ['Wand-/Flächenheizung', 'waermeabgabeGeschoss_Wand'],
  ]
  const selected = data.waermeabgabe || []
  const lines = rows
    .filter(([label]) => selected.includes(label))
    .map(([label, key]) => {
      const floors = data[key] || []
      return floors.length ? `${label} (${floors.join(', ')})` : label
    })
  return lines.length ? lines.join(', ') : '–'
}

function sanierungZeilen(data) {
  const selected = data.sanierungMassnahmen || []
  const lines = SANIERUNG.filter(([label]) => selected.includes(label)).map(([label, jahr, angabe]) => {
    return `- ${label}: Jahr ${dash(data[jahr])}, ${dash(data[angabe])}`
  })
  const extra = SANIERUNG.filter(([label, jahr, angabe]) => {
    return !selected.includes(label) && (String(data[jahr] || '').trim() || String(data[angabe] || '').trim())
  }).map(([label, jahr, angabe]) => `- ${label}: Jahr ${dash(data[jahr])}, ${dash(data[angabe])}`)
  const all = [...lines, ...extra]
  return all.length ? all.join('\n') : '–'
}

/** Liest alle Felder. Mehrfach-Checkboxen stehen in MULTI als Arrays. */
function readForm() {
  const data = {}
  const fd = new FormData(form)

  for (const [rawKey, value] of fd.entries()) {
    const key = fieldKey(rawKey)
    if (MULTI.includes(key)) {
      if (!Array.isArray(data[key])) data[key] = []
      data[key].push(value)
    } else {
      data[key] = value
    }
  }

  for (const key of MULTI) {
    if (!data[key]) data[key] = []
  }

  data.datenschutz = form.elements.datenschutz.checked
  data.kostentransparenz = form.elements.kostentransparenz.checked
  return data
}

/** Baut den Mailto-Text. CHECKLISTE_MAILTO überschreibt den Empfänger nur in lokalen Testskripten. */
function buildMailto(data) {
  const subject = `Erstanfrage Checkliste – ${data.eigentuemerName || 'Wohngebäude'}`
  const body = `Checkliste Datenaufnahme Wohngebäude 2026
=====================================

GEBÄUDEEIGENTÜMER/IN
Name: ${dash(data.eigentuemerName)}
Adresse: ${dash(data.eigentuemerStrasse)}, ${dash(data.eigentuemerPlzOrt)}
Kontakt: ${dash(data.eigentuemerKontakt)}

GEBÄUDEANGABEN
Adresse: ${dash(data.gebaeudeStrasse)}, ${dash(data.gebaeudePlzOrt)}
Baujahr: ${dash(data.baujahr)}
Wohnfläche: ${dash(data.wohnflaeche)}
Selbst bewohnt / übernommen seit: ${dash(data.selbstBewohnt)}
Gebäudeart: ${dash(data.gebaeudeart)}
Anzahl Nutzer: ${nutzer(data)}
Anzahl Wohneinheiten: ${dash(data.anzahlWohneinheiten)}
Gebäudeform: ${dash(data.gebaeudeform)}
Nutzung: ${list(data.gebaeudeNutzung)}
Mischnutzung: ${dash(data.mischnutzung)}
Wohn-/Gewerbeeinheiten: ${dash(data.mischWohnen)} / ${dash(data.mischGewerbe)}
Besonderheiten: ${dash(data.besonderheiten)} – ${dash(data.besonderheitenArt)}

HEIZUNG
Hersteller/Modell: ${dash(data.heizungHersteller)}
Einbaujahr: ${dash(data.heizungEinbaujahr)}
Typ: ${dash(data.heizungTyp)}
Holz-Ofen/Kamin: ${dash(data.ofen)} – wo: ${dash(data.ofenWo)}
Wärmeabgabe: ${waermeZeilen(data)}

WARMWASSER
Kombibereitung mit Heizung: ${dash(data.wwKombi)}
WW Einbaujahr: ${dash(data.wwEinbaujahr)}
WW Energieträger: ${dash(data.wwEnergietraeger)}
WW Hersteller/Modell: ${dash(data.wwHersteller)}

SOLARTHERMIE
Vorhanden: ${dash(data.solarthermie)}
Einbaujahr: ${dash(data.solarEinbaujahr)}
Standort: ${dash(data.solarStandort)}
Typ/Fläche: ${dash(data.solarTypFlaeche)}
Betriebsweise: ${dash(data.solarBetrieb)}

PHOTOVOLTAIK
Vorhanden: ${dash(data.photovoltaik)}
Einbaujahr: ${dash(data.pvEinbaujahr)}
Standort: ${dash(data.pvStandort)}
Typ/max. Leistung: ${dash(data.pvTypLeistung)}
Stromspeicher: ${dash(data.pvSpeicher)} ${dash(data.pvSpeicherKw)} kW

LÜFTUNG
Vorhanden: ${dash(data.lueftung)}
Einbaujahr: ${dash(data.lueftungEinbaujahr)}
Typ: ${dash(data.lueftungTyp)}
WRG: ${dash(data.lueftungWrg)}

SANIERUNGEN DURCHGEFÜHRT
Vorhanden: ${dash(data.sanierungDurchgefuehrt)}
${sanierungZeilen(data)}

GEPLANTE / NOTWENDIGE SANIERUNGEN
Vorhanden: ${dash(data.sanierungGeplant)}
${numbered(data, 'geplantMassnahme', 6, 'geplantZeitraum')}

EINKOMMEN / KINDER
Haushalts-Jahreseinkommen: ${dash(data.einkommen)}
Minderjährige Kinder: ${dash(data.kinder)}

MÄNGEL
Vorhanden: ${dash(data.maengel)}
${numbered(data, 'maengelAngabe', 5, 'maengelOrt')}

BERATUNGSZIELE
${list(data.beratungsziele)}

KOSTENTRANSPARENZ: ${data.kostentransparenz ? 'Ja' : 'Nein'}

DATUM / UNTERSCHRIFT (Angaben)
Datum, Ort: ${dash(data.datumOrt)}
Unterschrift: ${dash(data.unterschrift)}

VORLIEGENDE UNTERLAGEN
Planunterlagen: ${list(data.unterlagenPlan)}
Detailzeichnungen: ${list(data.unterlagenDetail)}
Weitere: ${list(data.unterlagenWeitere)}
Weitere Unterlagen:
${numbered(data, 'unterlagenSonstiges', 4)}

DATENSCHUTZ EINWILLIGUNG: ${data.datenschutz ? 'Ja' : 'Nein'}
Datum, Ort: ${dash(data.datumOrtDsgvo)}
Unterschrift: ${dash(data.unterschriftDsgvo)}
`

  return `mailto:${window.CHECKLISTE_MAILTO || EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** Pflichtfelder für das Modal. Namen müssen zu input name/id passen. */
const REQUIRED = [
  ['eigentuemerName', 'Name(n) GebäudeeigentümerIn'],
  ['eigentuemerKontakt', 'Telefonnummer, E-Mail'],
  ['gebaeudeStrasse', 'Gebäude: Straße Hausnummer'],
  ['gebaeudePlzOrt', 'Gebäude: PLZ, Ort'],
  ['kostentransparenz', 'Zustimmung Kostentransparenz'],
  ['datumOrt', 'Datum, Ort (Angaben)'],
  ['datenschutz', 'Einwilligung Datenschutz'],
  ['datumOrtDsgvo', 'Datum, Ort (Datenschutz)'],
]

const STORE_KEY = 'checkliste-2026'
const modal = document.getElementById('pflicht-modal')
const modalTitle = document.getElementById('pflicht-title')
const modalText = document.getElementById('pflicht-text')
const modalList = document.getElementById('pflicht-liste')
const modalGoto = document.getElementById('pflicht-goto')
const modalCopy = {
  title: modalTitle ? modalTitle.textContent : '',
  text: modalText ? modalText.textContent : '',
  button: modalGoto ? modalGoto.textContent : '',
}
let modalLastFocus = null
let missingFields = []
let sending = false

function persistForm() {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(readForm()))
  } catch (err) {
    /* private mode */
  }
}

function clearPersist() {
  try {
    sessionStorage.removeItem(STORE_KEY)
  } catch (err) {
    /* private mode */
  }
}

function restoreForm() {
  let data
  try {
    data = JSON.parse(sessionStorage.getItem(STORE_KEY) || '')
  } catch (err) {
    return
  }
  if (!data || typeof data !== 'object') return
  for (const el of form.elements) {
    if (!el.name || el.name === 'website') continue
    const key = fieldKey(el.name)
    const value = data[key]
    if (el.type === 'checkbox') {
      el.checked = MULTI.includes(key)
        ? Array.isArray(value) && value.includes(el.value)
        : Boolean(value)
    } else if (el.type === 'radio') {
      el.checked = value === el.value
    } else if (el.tagName !== 'BUTTON' && value != null && !Array.isArray(value)) {
      el.value = value
    }
  }
}

function fieldByName(name) {
  return form.elements[name]
}

function isFilled(name) {
  const field = fieldByName(name)
  if (!field) return true
  if (field.type === 'checkbox') return field.checked
  return String(field.value || '').trim() !== ''
}

function missingRequired() {
  return REQUIRED.filter(([name]) => !isFilled(name)).map(([name, label]) => ({ name, label, field: fieldByName(name) }))
}

function markMissing(items) {
  form.querySelectorAll('.is-missing').forEach((el) => el.classList.remove('is-missing'))
  items.forEach(({ field }) => {
    if (field) field.classList.add('is-missing')
  })
}

function closeModal() {
  if (!modal || modal.hidden) return
  modal.hidden = true
  document.body.style.overflow = ''
  if (modalLastFocus && typeof modalLastFocus.focus === 'function') {
    modalLastFocus.focus()
  }
}

function jumpToField(field) {
  closeModal()
  if (!field) return
  field.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => field.focus(), 250)
}

function openModal(items) {
  missingFields = items
  markMissing(items)
  if (modalTitle) modalTitle.textContent = modalCopy.title
  if (modalText) modalText.textContent = modalCopy.text
  if (modalGoto) modalGoto.textContent = modalCopy.button
  modalList.hidden = false
  modalList.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement('li')
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = item.label
      button.addEventListener('click', () => jumpToField(item.field))
      li.append(button)
      return li
    })
  )
  modalLastFocus = document.activeElement
  modal.hidden = false
  document.body.style.overflow = 'hidden'
  const first = modalList.querySelector('button')
  ;(first || modalGoto).focus()
}

function openSendError() {
  missingFields = []
  if (modalTitle) modalTitle.textContent = 'Versand fehlgeschlagen'
  if (modalText) {
    modalText.textContent =
      'Die E-Mail konnte nicht verschickt werden. Ihre Angaben sind noch im Formular. Bitte versuchen Sie es gleich noch einmal.'
  }
  modalList.replaceChildren()
  modalList.hidden = true
  if (modalGoto) modalGoto.textContent = 'Zurück zum Formular'
  modalLastFocus = document.activeElement
  modal.hidden = false
  document.body.style.overflow = 'hidden'
  modalGoto?.focus()
}

/** PHP-Ping: bei Antwort "php" JSON-POST, sonst Mailprogramm. */
function sendForm() {
  persistForm()
  const data = readForm()
  if (sending) return
  sending = true
  fetch('senden.php?ping=1', { cache: 'no-store' })
    .then((response) => (response.ok ? response.text() : ''))
    .then((text) => {
      if (String(text).trim() !== 'php') {
        window.location.href = buildMailto(data)
        return null
      }
      return fetch('senden.php', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json', 'X-Requested-With': 'fetch' },
      })
    })
    .then(async (response) => {
      if (!response) return
      const payload = await response.json().catch(() => ({}))
      if (payload.ok) {
        clearPersist()
        window.location.href = payload.redirect || 'danke.html'
        return
      }
      if (payload.error === 'pflicht') {
        openModal(missingRequired())
        return
      }
      openSendError()
    })
    .catch(() => {
      window.location.href = buildMailto(data)
    })
    .finally(() => {
      sending = false
    })
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const missing = missingRequired()
  if (missing.length) {
    openModal(missing)
    return
  }
  markMissing([])
  sendForm()
})

form.addEventListener('input', (event) => {
  persistForm()
  const field = event.target
  if (field && field.classList.contains('is-missing') && isFilled(field.name)) {
    field.classList.remove('is-missing')
  }
})

form.addEventListener('change', (event) => {
  persistForm()
  const field = event.target
  if (field && field.classList.contains('is-missing') && isFilled(field.name)) {
    field.classList.remove('is-missing')
  }
})

form.addEventListener('reset', () => {
  markMissing([])
  clearPersist()
})

restoreForm()

modal?.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-modal]')) closeModal()
})

modalGoto?.addEventListener('click', () => {
  jumpToField(missingFields[0]?.field)
})

document.addEventListener('keydown', (event) => {
  if (!modal || modal.hidden) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeModal()
    return
  }
  if (event.key !== 'Tab') return
  const focusable = [...modal.querySelectorAll('button')]
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
})

