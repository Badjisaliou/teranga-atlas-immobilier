from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_TAB_ALIGNMENT
from pathlib import Path

OUT = Path(r"C:\Users\DIALLO\Documents\ChatGPT\site_immobilier\Cahier_des_charges_Teranga_Atlas_Immobilier.docx")

NAVY = "16324F"
BLUE = "2E74B5"
TEAL = "1F7A8C"
PALE = "EAF2F7"
LIGHT = "F4F6F9"
MID = "D9E2EA"
INK = "1F2933"
GRAY = "667788"
WHITE = "FFFFFF"
GOLD = "C8902F"
RED = "A63D40"

doc = Document()
sec = doc.sections[0]
sec.page_width = Inches(8.5)
sec.page_height = Inches(11)
sec.top_margin = Inches(0.82)
sec.bottom_margin = Inches(0.78)
sec.left_margin = Inches(0.9)
sec.right_margin = Inches(0.9)
sec.header_distance = Inches(0.42)
sec.footer_distance = Inches(0.42)

def set_cell_shading(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        tcPr.append(shd)
    shd.set(qn('w:fill'), fill)

def set_cell_margins(cell, top=90, start=120, bottom=90, end=120):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in('w:tcMar')
    if tcMar is None:
        tcMar = OxmlElement('w:tcMar')
        tcPr.append(tcMar)
    for m, v in [('top', top), ('start', start), ('bottom', bottom), ('end', end)]:
        node = tcMar.find(qn('w:' + m))
        if node is None:
            node = OxmlElement('w:' + m)
            tcMar.append(node)
        node.set(qn('w:w'), str(v))
        node.set(qn('w:type'), 'dxa')

def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr()
    tblHeader = OxmlElement('w:tblHeader')
    tblHeader.set(qn('w:val'), 'true')
    trPr.append(tblHeader)

def set_table_geometry(table, widths_dxa):
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    tblPr = table._tbl.tblPr
    tblW = tblPr.find(qn('w:tblW'))
    if tblW is None:
        tblW = OxmlElement('w:tblW'); tblPr.append(tblW)
    tblW.set(qn('w:w'), str(sum(widths_dxa))); tblW.set(qn('w:type'), 'dxa')
    tblInd = tblPr.find(qn('w:tblInd'))
    if tblInd is None:
        tblInd = OxmlElement('w:tblInd'); tblPr.append(tblInd)
    tblInd.set(qn('w:w'), '120'); tblInd.set(qn('w:type'), 'dxa')
    grid = table._tbl.tblGrid
    for child in list(grid): grid.remove(child)
    for width in widths_dxa:
        col = OxmlElement('w:gridCol'); col.set(qn('w:w'), str(width)); grid.append(col)
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            width = widths_dxa[min(idx, len(widths_dxa)-1)]
            tcPr = cell._tc.get_or_add_tcPr()
            tcW = tcPr.find(qn('w:tcW'))
            if tcW is None:
                tcW = OxmlElement('w:tcW'); tcPr.append(tcW)
            tcW.set(qn('w:w'), str(width)); tcW.set(qn('w:type'), 'dxa')
            cell.width = Inches(width/1440)
            set_cell_margins(cell)

def font_run(run, size=10.5, bold=False, color=INK, italic=False, name='Aptos'):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn('w:ascii'), name)
    run._element.get_or_add_rPr().rFonts.set(qn('w:hAnsi'), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor.from_string(color)

styles = doc.styles
normal = styles['Normal']
normal.font.name = 'Aptos'; normal.font.size = Pt(10.5); normal.font.color.rgb = RGBColor.from_string(INK)
normal._element.rPr.rFonts.set(qn('w:ascii'), 'Aptos'); normal._element.rPr.rFonts.set(qn('w:hAnsi'), 'Aptos')
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.10

for name, size, color, before, after in [
    ('Title', 28, NAVY, 0, 8), ('Subtitle', 13, GRAY, 0, 10),
    ('Heading 1', 16, NAVY, 16, 8), ('Heading 2', 13, BLUE, 12, 6), ('Heading 3', 11.5, TEAL, 8, 4)]:
    st = styles[name]
    st.font.name = 'Aptos Display' if name in ('Title','Heading 1','Heading 2') else 'Aptos'
    st.font.size = Pt(size); st.font.bold = name != 'Subtitle'; st.font.color.rgb = RGBColor.from_string(color)
    st._element.rPr.rFonts.set(qn('w:ascii'), st.font.name); st._element.rPr.rFonts.set(qn('w:hAnsi'), st.font.name)
    st.paragraph_format.space_before = Pt(before); st.paragraph_format.space_after = Pt(after)
    st.paragraph_format.keep_with_next = True

for list_name in ('List Bullet', 'List Number'):
    st = styles[list_name]
    st.font.name = 'Aptos'; st.font.size = Pt(10.5)
    st.paragraph_format.left_indent = Inches(0.48)
    st.paragraph_format.first_line_indent = Inches(-0.23)
    st.paragraph_format.space_after = Pt(4)
    st.paragraph_format.line_spacing = 1.10

if 'Callout' not in styles:
    call = styles.add_style('Callout', WD_STYLE_TYPE.PARAGRAPH)
else: call = styles['Callout']
call.font.name='Aptos'; call.font.size=Pt(10.5); call.font.color.rgb=RGBColor.from_string(NAVY)
call.paragraph_format.left_indent=Inches(0.18); call.paragraph_format.right_indent=Inches(0.18)
call.paragraph_format.space_before=Pt(6); call.paragraph_format.space_after=Pt(9); call.paragraph_format.line_spacing=1.10

def add_field(paragraph, instr):
    run = paragraph.add_run()
    begin = OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'), 'begin')
    text = OxmlElement('w:instrText'); text.set(qn('xml:space'), 'preserve'); text.text = instr
    sep = OxmlElement('w:fldChar'); sep.set(qn('w:fldCharType'), 'separate')
    val = OxmlElement('w:t'); val.text = '1'
    end = OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'), 'end')
    run._r.extend([begin,text,sep,val,end])

header = sec.header
hp = header.paragraphs[0]
hp.text = 'TERANGA ATLAS IMMOBILIER  |  CAHIER DES CHARGES'
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
font_run(hp.runs[0], 8.5, True, GRAY)
footer = sec.footer
fp = footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
r=fp.add_run('Version 1.0  -  21 août 2026    |    Page '); font_run(r,8.5,False,GRAY); add_field(fp,'PAGE')

def add_p(text='', bold_prefix=None, italic=False, align=None, after=None):
    p=doc.add_paragraph()
    if bold_prefix and text.startswith(bold_prefix):
        a=p.add_run(bold_prefix); font_run(a,bold=True)
        b=p.add_run(text[len(bold_prefix):]); font_run(b,italic=italic)
    else:
        r=p.add_run(text); font_run(r,italic=italic)
    if align is not None: p.alignment=align
    if after is not None: p.paragraph_format.space_after=Pt(after)
    return p

def add_bullets(items, numbered=False):
    style='List Number' if numbered else 'List Bullet'
    for item in items:
        p=doc.add_paragraph(style=style)
        r=p.add_run(item); font_run(r)

def add_heading(text, level=1):
    return doc.add_paragraph(text, style=f'Heading {level}')

def add_callout(label, text, color=PALE):
    t=doc.add_table(rows=1, cols=1)
    set_table_geometry(t,[9360])
    set_repeat_table_header(t.rows[0])
    c=t.cell(0,0); set_cell_shading(c,color)
    p=c.paragraphs[0]
    r=p.add_run(label+'  '); font_run(r,10.5,True,NAVY)
    r=p.add_run(text); font_run(r,10.5,False,NAVY)
    doc.add_paragraph().paragraph_format.space_after=Pt(0)

def add_table(headers, rows, widths, header_fill=NAVY, small=9.4):
    t=doc.add_table(rows=1, cols=len(headers))
    t.style='Table Grid'
    set_table_geometry(t,widths)
    hdr=t.rows[0]; set_repeat_table_header(hdr)
    for i,h in enumerate(headers):
        c=hdr.cells[i]; set_cell_shading(c,header_fill); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p=c.paragraphs[0]; p.paragraph_format.space_after=Pt(0)
        r=p.add_run(h); font_run(r,small,True,WHITE)
    for row_i,row in enumerate(rows):
        cells=t.add_row().cells
        for i,val in enumerate(row):
            c=cells[i]; c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.TOP
            if row_i%2: set_cell_shading(c,'F8FAFC')
            p=c.paragraphs[0]; p.paragraph_format.space_after=Pt(0)
            r=p.add_run(str(val)); font_run(r,small,False,INK)
    set_table_geometry(t,widths)
    doc.add_paragraph().paragraph_format.space_after=Pt(0)
    return t

# Cover
doc.add_paragraph().paragraph_format.space_after=Pt(52)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=p.add_run('TERANGA ATLAS IMMOBILIER'); font_run(r,12,True,TEAL)
p.paragraph_format.space_after=Pt(20)
p=doc.add_paragraph(style='Title'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=p.add_run('CAHIER DES CHARGES'); font_run(r,30,True,NAVY,name='Aptos Display')
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=p.add_run('Conception et réalisation d’une plateforme immobilière'); font_run(r,15,False,BLUE)
p.paragraph_format.space_after=Pt(8)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=p.add_run('Vente  •  Location  •  Réservation  •  Gestion des annonces'); font_run(r,10.5,True,GRAY)
p.paragraph_format.space_after=Pt(46)
add_table(['DOCUMENT','INFORMATION'],[
    ('Maître d’ouvrage','Teranga Atlas Immobilier'),
    ('Répondant au cadrage','Khalifa Ababacar'),
    ('Zone de lancement','Marrakech et Casablanca, Maroc'),
    ('Version','1.0 - pour validation'),
    ('Date','21 août 2026'),
    ('Statut','Projet soumis à validation du maître d’ouvrage')
],[2350,7010],header_fill=TEAL,small=10)
doc.add_paragraph().paragraph_format.space_after=Pt(18)
add_callout('OBJET DU DOCUMENT', 'Définir le périmètre, les exigences, les responsabilités, le budget et les conditions de validation de la première version du site immobilier.', LIGHT)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(28)
r=p.add_run('Document confidentiel - diffusion limitée aux parties prenantes du projet'); font_run(r,8.5,False,GRAY,True)

doc.add_page_break()
add_heading('Fiche de validation',1)
add_p('La signature de cette page vaut validation du périmètre fonctionnel et technique décrit dans le présent cahier des charges. Toute évolution ultérieure susceptible d’affecter le coût, le délai ou l’architecture fera l’objet d’un avenant ou d’un bon de changement validé par les parties.')
add_table(['RÔLE','NOM','DATE','SIGNATURE'],[
    ('Maître d’ouvrage / commanditaire','','',''),
    ('Responsable du projet','','',''),
    ('Prestataire / maître d’œuvre','','','')
],[2800,2300,1700,2560],header_fill=NAVY,small=9.5)
add_heading('Décisions à confirmer avant démarrage',2)
add_bullets([
    'Date cible de mise en ligne et calendrier détaillé.',
    'Identité du responsable de traitement des données personnelles et adresse de contact dédiée.',
    'Choix définitif de l’hébergement, du nom de domaine et des fournisseurs SMS/WhatsApp.',
    'Validation du logo, de la palette graphique et des contenus initiaux.',
    'Nombre d’annonces à intégrer avant la recette et personnes autorisées à administrer le site.'
])
add_callout('RÈGLE DE GOUVERNANCE', 'Les champs non complétés ci-dessus n’empêchent pas la validation du besoin, mais ils doivent être arbitrés avant la phase concernée.', PALE)

add_heading('Sommaire',1)
toc=[
('1','Contexte et objectifs'),('2','Périmètre et priorités'),('3','Utilisateurs et parcours'),
('4','Exigences fonctionnelles'),('5','Contenus et arborescence'),('6','Exigences non fonctionnelles'),
('7','Protection des données et conformité'),('8','Administration et exploitation'),('9','Livrables et méthode'),
('10','Planning prévisionnel'),('11','Budget prévisionnel'),('12','Recette et acceptation'),
('13','Maintenance et responsabilités'),('14','Risques et hypothèses'),('15','Annexes')]
add_table(['N°','SECTION'],toc,[900,8460],header_fill=TEAL,small=9.5)

doc.add_page_break()
add_heading('1. Contexte et objectifs',1)
add_heading('1.1 Présentation du projet',2)
add_p('Teranga Atlas Immobilier est une agence immobilière intervenant initialement à Marrakech et Casablanca. Elle souhaite faciliter l’accès à des biens immobiliers au Maroc, notamment pour les membres de la diaspora et les personnes résidant ou séjournant au Maroc.')
add_p('Le futur site doit constituer à la fois une vitrine de confiance, un catalogue d’annonces et un outil de génération et de suivi des demandes. La conclusion des réservations restera, dans la première version, accompagnée par un agent et finalisée principalement via WhatsApp.')
add_heading('1.2 Objectifs métiers',2)
add_bullets([
    'Publier et valoriser les biens disponibles à la vente ou à la location.',
    'Permettre une recherche rapide selon les critères essentiels du client.',
    'Transformer les visites du site en demandes qualifiées, visites et réservations.',
    'Centraliser les annonces et les demandes dans un espace d’administration.',
    'Renforcer la crédibilité et la visibilité organique de l’agence au Maroc et auprès de la diaspora.',
    'Préparer une architecture évolutive vers des comptes clients et services complémentaires.'
])
add_heading('1.3 Publics cibles',2)
add_table(['PUBLIC','BESOINS PRINCIPAUX'],[
    ('Acheteurs et locataires','Trouver un bien, comparer les offres, demander une visite ou une réservation.'),
    ('Diaspora et clientèle internationale','Accéder à une information claire à distance, en français, anglais ou arabe, puis échanger facilement avec l’agence.'),
    ('Propriétaires et vendeurs','Confier un bien à l’agence et suivre sa commercialisation, dans une phase ultérieure.'),
    ('Entreprises et investisseurs','Identifier des bureaux, immeubles, terrains et opportunités professionnelles.'),
    ('Agents de Teranga Atlas Immobilier','Créer les annonces et traiter les demandes depuis l’administration.')
],[2500,6860],header_fill=NAVY,small=9.2)
add_heading('1.4 Critères de réussite à six mois',2)
add_bullets([
    'Le catalogue est régulièrement tenu à jour et chaque bien publié contient les informations minimales exigées.',
    'Les visiteurs peuvent identifier un bien pertinent et contacter l’agence sans assistance technique.',
    'Toutes les demandes issues du site sont traçables et affectées à un agent.',
    'Le site est correctement indexé sur les requêtes immobilières prioritaires.',
    'Le maître d’ouvrage dispose des accès, procédures et compétences nécessaires pour exploiter la plateforme.'
])

add_heading('2. Périmètre et priorités',1)
add_heading('2.1 Fonctionnalités indispensables de la version 1',2)
add_table(['PRIORITÉ','FONCTIONNALITÉ','RÉSULTAT ATTENDU'],[
    ('P1','Catalogue d’annonces administrable','Ajouter, modifier, publier, masquer et archiver les biens.'),
    ('P1','Recherche multicritère','Filtrer les annonces par transaction, type, ville, quartier, surface, chambres, équipements et disponibilité.'),
    ('P1','Fiche détaillée du bien','Présenter médias, caractéristiques, localisation, disponibilité, agent et actions de partage.'),
    ('P1','Demandes de visite ou réservation','Collecter une demande structurée et permettre la poursuite de l’échange par WhatsApp.'),
    ('P1','Administration et suivi','Gérer les annonces, consulter les demandes, planifier les visites et suivre les statuts.')
],[900,3100,5360],header_fill=TEAL,small=9.1)
add_heading('2.2 Périmètre inclus',2)
add_bullets([
    'Site responsive en français, anglais et arabe, avec interface arabe de droite à gauche.',
    'Pages institutionnelles, catalogue vente/location, fiches de biens, services, actualités, témoignages, FAQ et contact.',
    'Partage d’une annonce par WhatsApp, Facebook, e-mail et copie de lien.',
    'Prix visible ou mention « Prix sur demande » selon le bien.',
    'Téléchargement ou impression d’une fiche de bien en PDF.',
    'Référencement technique initial, mesure d’audience et raccordement aux réseaux sociaux.',
    'Gestion d’environ cinq utilisateurs internes avec droits d’administration définis.'
])
add_heading('2.3 Hors périmètre de la version 1',2)
add_bullets([
    'Paiement en ligne, encaissement de caution et génération de factures.',
    'Signature électronique et gestion complète des contrats immobiliers.',
    'Gestion comptable des loyers, échéances, cautions et commissions.',
    'Dépôt autonome de biens par les propriétaires et espace de suivi propriétaire.',
    'CRM immobilier externe ou synchronisation avec un logiciel existant.',
    'Application mobile native iOS ou Android.'
])
add_heading('2.4 Évolutions proposées en version 2',2)
add_bullets([
    'Comptes clients, favoris synchronisés et historique des demandes.',
    'Alertes immobilières par SMS ou WhatsApp.',
    'Carte interactive des résultats et recherche géolocalisée.',
    'Dépôt de biens avec validation préalable par l’agence.',
    'Statistiques avancées pour les propriétaires et les agents.',
    'Demande d’estimation immobilière.'
])

add_heading('3. Utilisateurs et parcours',1)
add_heading('3.1 Rôles',2)
add_table(['RÔLE','DROITS PRINCIPAUX'],[
    ('Visiteur','Consulter, rechercher, partager et envoyer une demande.'),
    ('Client identifié - V2','Gérer favoris, alertes, rendez-vous et documents.'),
    ('Agent immobilier','Gérer les biens autorisés et traiter les demandes affectées.'),
    ('Administrateur principal','Gérer tous les biens, demandes, contenus, utilisateurs et paramètres.'),
    ('Prestataire technique','Intervenir uniquement pour la maintenance, selon les accès autorisés et tracés.')
],[2700,6660],header_fill=NAVY,small=9.3)
add_heading('3.2 Parcours principal d’un visiteur',2)
add_bullets([
    'Accéder à l’accueil ou à une page issue d’un moteur de recherche.',
    'Choisir vente ou location et renseigner ses principaux critères.',
    'Comparer la liste des résultats et ouvrir une fiche détaillée.',
    'Consulter les photos, caractéristiques, zone, disponibilité et conditions.',
    'Demander des informations, une visite ou une réservation sans paiement.',
    'Recevoir une confirmation et poursuivre l’échange avec l’agent par WhatsApp.'
], numbered=True)
add_heading('3.3 Parcours principal d’un agent',2)
add_bullets([
    'Se connecter à l’espace sécurisé.',
    'Créer ou mettre à jour une annonce et ses médias.',
    'Publier, masquer ou marquer le bien comme vendu ou loué.',
    'Consulter une nouvelle demande automatiquement affectée.',
    'Contacter le prospect, planifier la visite et mettre à jour le statut.'
], numbered=True)

add_heading('4. Exigences fonctionnelles',1)
add_heading('4.1 Gestion des annonces',2)
add_bullets([
    'Chaque bien possède un identifiant unique et une référence lisible.',
    'Types couverts : appartements, maisons, villas, terrains, immeubles, bureaux et résidences meublées.',
    'Transactions : vente, location ou les deux selon le bien.',
    'Statuts éditoriaux : brouillon, publié, masqué, vendu, loué et archivé.',
    'Mises en avant : nouveau, exclusif et coup de cœur.',
    'Les biens vendus ou loués peuvent rester visibles pendant une durée configurable.',
    'Une annonce accepte au minimum quatre photos ; la limite technique devra être configurable.'
])
add_heading('4.2 Données d’une fiche de bien',2)
add_table(['CHAMP','OBLIGATION / RÈGLE'],[
    ('Titre et référence','Obligatoires.'),('Type et transaction','Obligatoires.'),
    ('Prix','Visible ou remplacé par « Prix sur demande ».'),('Adresse','Adresse exacte ou zone approximative selon le bien.'),
    ('Ville et quartier','Obligatoires pour la recherche.'),('Surface, pièces, chambres, salles de bain','Renseignées lorsqu’applicables.'),
    ('Description et équipements','Présentation multilingue et structurée.'),('Photos','Au moins une photo ; quatre prévues habituellement.'),
    ('Vidéo, visite virtuelle, plan','Facultatifs.'),('Carte','Préparée techniquement ; affichage généralisé en V2.'),
    ('Agent et disponibilité','Obligatoires avant publication.'),('Documents','Téléchargement uniquement pour les documents autorisés.')
],[3000,6360],header_fill=TEAL,small=8.9)
add_heading('4.3 Recherche et tri',2)
add_p('Le moteur proposera les critères : vente/location, type de bien, ville, quartier, surface, nombre de chambres, meublé, équipements et disponibilité. Le prix minimum/maximum sera prévu dans le modèle de données et pourra être activé à la validation des maquettes.')
add_p('Les résultats pourront être triés par date de publication, popularité et ordre recommandé par l’agence. La pagination ou le chargement progressif devra préserver les performances et l’indexabilité.')
add_heading('4.4 Demandes, visites et réservations',2)
add_bullets([
    'Actions disponibles : demander des informations, demander une visite, proposer une date, appeler, envoyer un e-mail ou contacter via WhatsApp.',
    'La demande de réservation ne déclenche aucun paiement et n’a pas valeur de confirmation contractuelle.',
    'Le formulaire collecte uniquement les coordonnées et informations nécessaires au traitement de la demande.',
    'Une confirmation automatique est envoyée par SMS ou WhatsApp selon le service retenu.',
    'La demande est affectée automatiquement à un agent selon une règle configurable.',
    'Les statuts minimaux sont : nouvelle, prise en charge, rendez-vous planifié, en attente, conclue et abandonnée.'
])
add_heading('4.5 Partage et fiche PDF',2)
add_p('Chaque annonce pourra être partagée sur WhatsApp et Facebook, envoyée par e-mail ou copiée sous forme de lien. Une version imprimable ou téléchargeable en PDF présentera uniquement les informations autorisées par l’agence.')

add_heading('5. Contenus et arborescence',1)
add_heading('5.1 Arborescence cible',2)
add_table(['NIVEAU 1','CONTENU / SOUS-PAGES'],[
    ('Accueil','Moteur de recherche, biens mis en avant, services, preuves de confiance et appels à l’action.'),
    ('Biens à vendre','Liste filtrable et pages par type de bien.'),
    ('Biens à louer','Liste filtrable et pages par type de bien.'),
    ('Fiche du bien','Médias, description, caractéristiques, localisation et contact.'),
    ('Nos services','Achat/recherche, vente, location saisonnière, gestion locative, terrains, immobilier professionnel, promotion.'),
    ('À propos','Présentation, valeurs, zones couvertes et méthode d’accompagnement.'),
    ('Actualités / conseils','Articles SEO et conseils immobiliers.'),
    ('Témoignages','Avis clients validés.'),('FAQ','Questions fréquentes.'),('Contact','Coordonnées, formulaire et WhatsApp.'),
    ('Pages légales','Mentions légales, confidentialité, cookies et conditions d’utilisation.')
],[2500,6860],header_fill=NAVY,small=9.0)
add_heading('5.2 Langues',2)
add_p('Le site sera disponible en français, anglais et arabe. Le français constitue la langue de référence pour la recette de contenu. Les versions traduites doivent conserver le sens métier ; l’arabe doit être affiché avec une mise en page de droite à gauche. Les traductions et leur validation finale relèvent du maître d’ouvrage, sauf prestation éditoriale explicitement intégrée au devis.')
add_heading('5.3 Production des contenus',2)
add_p('Le questionnaire indique que les contenus seront préparés avec l’appui du développeur. Pour éviter une ambiguïté contractuelle, le devis devra distinguer : structuration et intégration, rédaction originale, traduction, retouche photo et production vidéo. Le maître d’ouvrage garantit les droits d’utilisation des textes, logos, photographies et documents fournis.')
add_heading('5.4 Référencement',2)
add_bullets([
    'Structure éditoriale ciblant notamment « immobilier Maroc », « location appartement Maroc », « immobilier Marrakech » et « immobilier Casablanca ».',
    'Adresses URL lisibles, métadonnées uniques, plan de site XML et données structurées adaptées aux annonces.',
    'Pages de destination par ville et type de bien lorsque le contenu est suffisamment distinct.',
    'Outils de mesure d’audience et de suivi des demandes, sous réserve du consentement requis.',
    'Préparation aux campagnes Google Ads et Meta, dont les budgets médias restent hors périmètre.'
])

add_heading('6. Exigences non fonctionnelles',1)
add_heading('6.1 Compatibilité et accessibilité',2)
add_bullets([
    'Affichage adapté aux téléphones, tablettes et ordinateurs.',
    'Compatibilité avec les versions récentes des principaux navigateurs.',
    'Navigation utilisable au clavier, contrastes lisibles, libellés explicites et textes alternatifs pour les images utiles.',
    'Formulaires accompagnés de messages d’erreur compréhensibles et non fondés uniquement sur la couleur.'
])
add_heading('6.2 Performance et connexion lente',2)
add_bullets([
    'Images redimensionnées, compressées et chargées progressivement.',
    'Poids des pages maîtrisé et scripts externes limités.',
    'Mise en cache des ressources publiques et optimisation de la base de données.',
    'Objectif indicatif : pages essentielles interactives en moins de trois secondes sur une connexion mobile correcte, sous réserve du réseau et des services tiers.'
])
add_heading('6.3 Disponibilité, sauvegardes et sécurité',2)
add_bullets([
    'Connexion HTTPS obligatoire sur l’ensemble du site.',
    'Mots de passe stockés sous forme hachée, politique de robustesse et limitation des tentatives de connexion.',
    'Contrôle des droits côté serveur et séparation des rôles.',
    'Protection contre les principales vulnérabilités web, validation des fichiers et limitation de leur taille/type.',
    'Sauvegardes automatisées de la base et des médias, avec test périodique de restauration.',
    'Journalisation des erreurs et alertes techniques sans exposition de données personnelles dans les journaux.'
])
add_heading('6.4 Architecture et réversibilité',2)
add_p('Le prestataire proposera une architecture maintenable, documentée et déployable sur un hébergement adapté. À la livraison, le maître d’ouvrage doit recevoir les accès, le code source, les paramètres d’exploitation, la base de données exportable et la documentation nécessaire à un changement de prestataire.')

add_heading('7. Protection des données et conformité',1)
add_callout('PRINCIPE', 'Teranga Atlas Immobilier est responsable du traitement. Le prestataire technique agit comme sous-traitant pour les opérations réalisées pour son compte. Les formalités et mentions définitives doivent être validées avant la mise en production.', 'FFF7E8')
add_heading('7.1 Données collectées',2)
add_bullets([
    'Nom, prénom, téléphone, e-mail, pays de résidence et langue préférée.',
    'Critères immobiliers, bien concerné, demande, rendez-vous et historique des échanges.',
    'Pour les propriétaires, informations sur le bien et documents strictement nécessaires.',
    'Données techniques de connexion, sécurité et choix relatifs aux cookies.'
])
add_p('Aucun document d’identité, justificatif financier ou document sensible ne sera demandé lors d’une simple prise de contact. Toute collecte ultérieure devra être justifiée, sécurisée et limitée aux personnes autorisées.')
add_heading('7.2 Information, consentement et droits',2)
add_bullets([
    'Chaque formulaire indique la finalité, les champs obligatoires, les destinataires, la durée de conservation et le moyen d’exercer ses droits.',
    'Le consentement est demandé pour les alertes, communications commerciales et cookies non indispensables.',
    'L’utilisateur peut demander l’accès, la rectification, l’opposition ou la suppression selon les conditions légales.',
    'Un contact dédié et une procédure interne de traitement des demandes sont établis avant lancement.'
])
add_heading('7.3 Durées de conservation proposées',2)
add_table(['CATÉGORIE','DURÉE DE CADRAGE'],[
    ('Demandes sans suite','12 mois après le dernier échange.'),
    ('Comptes inactifs - V2','24 mois après la dernière activité.'),
    ('Alertes - V2','Jusqu’au désabonnement ou 12 mois d’inactivité.'),
    ('Documents de transaction','Durée contractuelle puis durée légale applicable.'),
    ('Journaux techniques et sécurité','6 à 12 mois selon la nécessité.'),
    ('Choix de cookies','Durée définie dans la politique de cookies et réexaminée régulièrement.')
],[3900,5460],header_fill=TEAL,small=9.1)
add_p('Ces durées sont des propositions opérationnelles à valider juridiquement. À l’échéance, les données doivent être supprimées ou anonymisées, sauf obligation légale contraire.')
add_heading('7.4 Formalités et transferts',2)
add_p('Le traitement sera déclaré ou autorisé auprès de la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP) lorsque la réglementation l’exige. Les fournisseurs d’hébergement, de mesure d’audience, d’e-mail, de SMS ou de WhatsApp seront recensés. Tout transfert de données hors du Maroc fera l’objet de la vérification et des formalités requises.')
add_heading('7.5 Références de conformité',2)
add_bullets([
    'Loi marocaine n° 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel.',
    'Recommandations et formulaires publiés par la CNDP : www.cndp.ma.',
    'Validation juridique recommandée avant publication des mentions et politiques définitives.'
])

add_heading('8. Administration et exploitation',1)
add_heading('8.1 Utilisateurs internes',2)
add_p('Environ cinq utilisateurs internes sont prévus. La version initiale comprend au minimum le rôle Administrateur principal. Le rôle Agent immobilier sera activé si la séparation des accès par agent est validée pendant la conception détaillée.')
add_heading('8.2 Fonctions administratives',2)
add_bullets([
    'Ajouter, modifier, prévisualiser, publier, masquer et archiver les annonces.',
    'Gérer les photos et documents associés.',
    'Consulter, filtrer, affecter et mettre à jour les demandes.',
    'Planifier les visites et suivre les statuts de vente/location.',
    'Gérer les clients et propriétaires dans la limite du périmètre autorisé.',
    'Exporter les données utiles dans un format courant.',
    'Consulter les statistiques principales : visites, annonces consultées, demandes et sources.'
])
add_heading('8.3 Règles d’exploitation',2)
add_bullets([
    'Une annonce ne peut être publiée sans titre, transaction, type, ville, disponibilité, agent et photographie principale.',
    'Les coordonnées personnelles ne sont jamais affichées publiquement sans validation.',
    'Les comptes administratifs sont nominatifs et ne doivent pas être partagés.',
    'La conservation d’un historique détaillé des modifications n’est pas requise en V1, mais les événements de sécurité essentiels restent journalisés.'
])

add_heading('9. Livrables et méthode',1)
add_heading('9.1 Livrables attendus',2)
add_bullets([
    'Arborescence et parcours utilisateurs validés.',
    'Maquettes responsive des écrans principaux.',
    'Site public trilingue et espace d’administration.',
    'Base de données et mécanismes d’import/export prévus.',
    'Configuration du domaine, HTTPS, sauvegardes et environnement de production.',
    'Documentation d’administration et d’exploitation.',
    'Formation des utilisateurs internes.',
    'Code source, accès et inventaire des services tiers.',
    'Procès-verbal de recette et garantie corrective.'
])
add_heading('9.2 Méthode de validation',2)
add_bullets([
    'Chaque phase fait l’objet d’une présentation et d’un retour consolidé du maître d’ouvrage.',
    'Le maître d’ouvrage désigne un interlocuteur ayant autorité pour valider.',
    'Les retours sont regroupés afin d’éviter des demandes contradictoires.',
    'Une demande nouvelle après validation est analysée en termes de coût et de délai avant réalisation.'
])

add_heading('10. Planning prévisionnel',1)
add_p('Sous réserve de disponibilité des contenus et de validation dans les délais, la version 1 peut être réalisée sur une période indicative de huit à dix semaines.')
add_table(['PHASE','DURÉE','SORTIE / JALON'],[
    ('1. Lancement et conception détaillée','1 semaine','Périmètre confirmé, architecture et responsabilités.'),
    ('2. UX, arborescence et maquettes','2 semaines','Maquettes responsive validées.'),
    ('3. Développement et administration','3 à 4 semaines','Version fonctionnelle de démonstration.'),
    ('4. Contenus, traductions et intégrations','1 à 2 semaines','Contenus initiaux et services externes configurés.'),
    ('5. Recette, corrections et formation','1 à 2 semaines','PV de recette, formation et mise en ligne.')
],[3600,1700,4060],header_fill=NAVY,small=9.0)
add_callout('DATE CIBLE', 'À compléter par le maître d’ouvrage : ________________________________', LIGHT)

add_heading('11. Budget prévisionnel',1)
add_heading('11.1 Enveloppe de la version 1',2)
add_callout('BUDGET RECOMMANDÉ', '1 850 000 à 2 750 000 FCFA HT, hors campagnes publicitaires et frais récurrents.', PALE)
add_p('Cette enveloppe correspond approximativement à 30 000 à 45 000 MAD, sur la base indicative de 1 MAD ≈ 61,08 FCFA observée en août 2026. Le montant contractuel sera fixé dans le devis accepté ; le taux de change ne constitue pas une clause d’indexation automatique.')
add_table(['POSTE','FOURCHETTE INDICATIVE'],[
    ('Conception fonctionnelle et maquettes','245 000 à 365 000 FCFA'),
    ('Développement du site et administration','980 000 à 1 405 000 FCFA'),
    ('Gestion multilingue français / anglais / arabe','185 000 à 305 000 FCFA'),
    ('SEO initial, sécurité, tests et mise en ligne','245 000 à 365 000 FCFA'),
    ('Formation et garantie corrective','120 000 à 185 000 FCFA'),
    ('Réserve pour imprévus','Environ 10 % selon le devis')
],[6000,3360],header_fill=TEAL,small=9.3)
add_heading('11.2 Coûts récurrents',2)
add_bullets([
    'Domaine et hébergement : environ 60 000 à 185 000 FCFA par an.',
    'Maintenance et mises à jour : environ 30 000 à 90 000 FCFA par mois.',
    'SMS, cartographie, WhatsApp et autres services : selon la consommation et les tarifs des fournisseurs.',
    'Publicité, traduction professionnelle, rédaction, photographie et vidéo : budgets séparés.'
])
add_p('Budget prudent de fonctionnement annuel hors publicité : environ 430 000 à 1 220 000 FCFA. Une deuxième phase fonctionnelle peut représenter environ 915 000 à 1 835 000 FCFA selon le périmètre retenu.')
add_heading('11.3 Modalités de paiement proposées',2)
add_bullets([
    '40 % à la commande et au lancement du projet.',
    '30 % après validation des maquettes et du socle fonctionnel.',
    '30 % après recette, avant mise en production définitive.',
    'Toute licence ou prestation tierce payante est identifiée avant engagement.'
])

add_heading('12. Recette et acceptation',1)
add_heading('12.1 Environnement de recette',2)
add_p('La recette est réalisée sur un environnement de préproduction contenant un jeu d’annonces représentatif. Le maître d’ouvrage dispose d’une période de cinq à dix jours ouvrés pour transmettre un relevé consolidé des anomalies.')
add_heading('12.2 Critères d’acceptation prioritaires',2)
add_table(['ID','CRITÈRE','RÉSULTAT ATTENDU'],[
    ('REC-01','Publication d’une annonce','Un administrateur crée, prévisualise et publie un bien sans intervention technique.'),
    ('REC-02','Recherche','Les critères sélectionnés retournent uniquement les biens correspondants.'),
    ('REC-03','Fiche du bien','Les caractéristiques, médias, disponibilité et contacts sont correctement affichés.'),
    ('REC-04','Demande','Une demande est enregistrée, affectée et confirmée selon le canal configuré.'),
    ('REC-05','Responsive','Les parcours essentiels restent utilisables sur téléphone, tablette et ordinateur.'),
    ('REC-06','Multilingue','Les écrans essentiels existent dans les trois langues et l’arabe s’affiche de droite à gauche.'),
    ('REC-07','Sécurité','Les pages privées exigent une authentification et respectent les droits attribués.'),
    ('REC-08','SEO','Les pages publiques possèdent titre, description, URL lisible et plan de site.'),
    ('REC-09','Données','Les mentions, consentements et durées configurés sont conformes aux décisions validées.'),
    ('REC-10','Transmission','Les accès, sources, sauvegardes, documentation et formation sont remis.')
],[1100,2600,5660],header_fill=NAVY,small=8.7)
add_heading('12.3 Classification des anomalies',2)
add_bullets([
    'Bloquante : empêche un parcours essentiel ou expose un risque critique ; correction requise avant mise en ligne.',
    'Majeure : fonction importante incorrecte sans solution acceptable ; correction requise avant acceptation.',
    'Mineure : défaut sans impact significatif ; peut être corrigé pendant la garantie selon accord.'
])

add_heading('13. Maintenance et responsabilités',1)
add_heading('13.1 Répartition après lancement',2)
add_table(['ACTIVITÉ','RESPONSABLE PRINCIPAL'],[
    ('Ajout et mise à jour des annonces','Agents immobiliers habilités.'),
    ('Validation, retrait et archivage des annonces','Administrateur principal.'),
    ('Mise à jour des pages et contenus','Teranga Atlas Immobilier ; assistance du prestataire selon contrat.'),
    ('Réponse aux prospects et support métier','Agents immobiliers.'),
    ('Protection des données et demandes des personnes','Dirigeant ou référent désigné par Teranga Atlas Immobilier.'),
    ('Maintenance corrective, sécurité et mises à jour','Prestataire technique sous contrat.'),
    ('Domaine, hébergement et services tiers','Teranga Atlas Immobilier, avec suivi d’échéance par l’administrateur.'),
    ('Sauvegardes et restauration','Prestataire/hébergeur selon contrat, sous contrôle du maître d’ouvrage.')
],[4500,4860],header_fill=TEAL,small=9.0)
add_heading('13.2 Garantie et maintenance',2)
add_p('Le devis doit prévoir une garantie corrective minimale après mise en ligne, distincte des évolutions fonctionnelles. Le contrat de maintenance précisera les horaires de support, délais de prise en charge, mises à jour de sécurité, sauvegardes, supervision, exclusions et conditions de réversibilité.')
add_heading('13.3 Propriété et accès',2)
add_p('Sous réserve du règlement complet, le maître d’ouvrage reçoit les droits et accès prévus au contrat sur les développements spécifiques, contenus et données. Les composants tiers restent soumis à leurs licences. Les comptes d’hébergement, domaine et services stratégiques doivent idéalement être ouverts au nom de Teranga Atlas Immobilier.')

add_heading('14. Risques et hypothèses',1)
add_table(['RISQUE / HYPOTHÈSE','MESURE DE MAÎTRISE'],[
    ('Contenus ou traductions livrés tardivement','Calendrier éditorial, responsable nommé et contenus minimaux validés avant intégration finale.'),
    ('Périmètre élargi pendant le développement','Procédure de changement avec estimation du coût et du délai.'),
    ('Qualité insuffisante des photos','Règles de format, compression et contrôle avant publication.'),
    ('Dépendance à WhatsApp, SMS ou cartographie','Inventaire des coûts, quotas, conditions d’utilisation et solution de repli.'),
    ('Données personnelles transférées à l’étranger','Cartographie des prestataires et formalités CNDP avant activation.'),
    ('Absence de responsable interne après lancement','Nomination et formation d’un administrateur principal et d’un suppléant.'),
    ('Référencement attendu trop rapidement','Objectifs progressifs, contenus réguliers et distinction SEO naturel / publicité.'),
    ('Budget insuffisant pour tout le périmètre','Prioriser les cinq fonctions P1 et reporter les options en version 2.')
],[3900,5460],header_fill=NAVY,small=8.9)

add_heading('15. Annexes',1)
add_heading('15.1 Matrice de priorisation',2)
add_table(['FONCTIONNALITÉ','VERSION','PRIORITÉ','VALIDATION'],[
    ('Catalogue et administration des annonces','V1','Indispensable','☐ Validé'),
    ('Recherche multicritère','V1','Indispensable','☐ Validé'),
    ('Fiche détaillée et partage','V1','Indispensable','☐ Validé'),
    ('Demandes de visite / réservation','V1','Indispensable','☐ Validé'),
    ('Suivi administratif des demandes','V1','Indispensable','☐ Validé'),
    ('Comptes clients et favoris','V2','Utile','☐ Validé'),
    ('Alertes SMS / WhatsApp','V2','Utile','☐ Validé'),
    ('Carte interactive','V2','Utile','☐ Validé'),
    ('Dépôt de biens propriétaire','V2','Plus tard','☐ Validé'),
    ('Paiement et contrat en ligne','Hors périmètre','Plus tard','☐ Validé')
],[3900,1500,1800,2160],header_fill=TEAL,small=8.9)
add_heading('15.2 Coordonnées de référence',2)
add_table(['ÉLÉMENT','VALEUR'],[
    ('Entreprise','Teranga Atlas Immobilier'),
    ('Répondant','Khalifa Ababacar'),
    ('Téléphone','221 77 848 76 26'),
    ('Zones de lancement','Marrakech et Casablanca, Maroc'),
    ('Sites d’inspiration','loger-dakar.com ; leboncoin.fr/c/_immobilier'),
    ('Langues','Français, anglais et arabe')
],[2700,6660],header_fill=NAVY,small=9.3)
add_heading('15.3 Sources et réserves',2)
add_bullets([
    'Document de cadrage : Questionnaire_cadrage_site_immobilier.docx, renseigné le 21 août 2026.',
    'Protection des données : loi marocaine n° 09-08 et ressources de la CNDP, à confirmer avec un conseil compétent avant lancement.',
    'Conversion budgétaire indicative : 1 MAD ≈ 61,08 FCFA en août 2026 ; le devis contractuel prévaut.',
    'Les marques et services tiers mentionnés restent soumis à leurs conditions, tarifs et disponibilités.'
])
add_callout('APPROBATION FINALE', 'Après validation et signature, ce document devient la référence de périmètre pour la conception, le développement et la recette de la version 1.', PALE)

# Keep table rows from splitting and standardize cell paragraphs.
for table in doc.tables:
    for row in table.rows:
        trPr=row._tr.get_or_add_trPr()
        cant=OxmlElement('w:cantSplit'); trPr.append(cant)
        for cell in row.cells:
            for p in cell.paragraphs:
                p.paragraph_format.keep_together=True

# Metadata
doc.core_properties.title='Cahier des charges - Teranga Atlas Immobilier'
doc.core_properties.subject='Conception et réalisation du site immobilier'
doc.core_properties.author='Teranga Atlas Immobilier'
doc.core_properties.keywords='immobilier, Maroc, cahier des charges, annonces, location, vente'
doc.core_properties.comments='Version 1.0 pour validation du maître d’ouvrage.'

doc.save(OUT)
print(OUT)
