/* ================================================================
   seed.js — données initiales, RECOPIÉES À L'IDENTIQUE de
   « pâté 2026.xlsx » (aucun chiffre modifié).
   Sert de base de départ ; ensuite tout est modifiable dans le site.
   ================================================================ */
window.App = window.App || {};

App.seed = (function () {

  // Clés de recettes (colonnes D..M de l'onglet Recettes)
  // lievre, chevreuil, sanglier_camp, faisan, daube,
  // foie_sanglier, foie_chevreuil, rillette_perdreaux, rillette_lievre, civet

  function build() {
    return {
      meta: { version: 1, createdAt: new Date().toISOString() },

      params: {
        lieu: 'VINCENT (Maninghem)',
        annee: 2026,
        nbParticipants: 7,
        adminPass: 'pate',
      },

      /* Formats de bocaux : nominal (étiquette commerciale) et poids réel de remplissage */
      formats: [
        { id: 'f110', nominalG: 125,  reelG: 110 },
        { id: 'f180', nominalG: 200,  reelG: 180 },
        { id: 'f315', nominalG: 350,  reelG: 315 },
        { id: 'f450', nominalG: 500,  reelG: 450 },
        { id: 'f675', nominalG: 750,  reelG: 675 },
        { id: 'f900', nominalG: 1000, reelG: 900 },
        { id: 'f1350', nominalG: 1500, reelG: 1350 },
      ],
      formatSuggere: 'f315', // format servant au « nombre de bocaux suggéré »

      /* Chasseurs / participants (colonnes de l'onglet Stocks Gibier) */
      participants: [
        { id: 'p_vincent',  nom: 'vincent',  actif: true },
        { id: 'p_denis',    nom: 'denis',    actif: true },
        { id: 'p_thomas',   nom: 'thomas D', actif: true },
        { id: 'p_benoit',   nom: 'benoit',   actif: true },
        { id: 'p_jb',       nom: 'JB',       actif: true },
        { id: 'p_francois', nom: 'françois', actif: true },
        { id: 'p_olivier',  nom: 'olivier',  actif: true },
        { id: 'p_antoine',  nom: 'antoine',  actif: true },
        { id: 'p_frederic', nom: 'frederic', actif: true },
      ],

      /* Types de gibier + rendement (kg net = kg brut × rendement) */
      gibier: [
        { id: 'g_lievre_os',      nom: 'lièvre avec os',                     rendement: 0.56 },
        { id: 'g_lievre_sansos',  nom: 'lièvre sans os',                     rendement: 1 },
        { id: 'g_lievre_rillette',nom: 'lièvre pour rillette',               rendement: 1 },
        { id: 'g_chev_epaule',    nom: 'chevreuil épaule / gigue entières',  rendement: 0.65 },
        { id: 'g_chev_chair',     nom: 'chevreuil chair',                    rendement: 1 },
        { id: 'g_chev_foie',      nom: 'foie et abats chevreuil',            rendement: 0.9 },
        { id: 'g_foiechev_camp',  nom: 'foie chevreuil pour pâté campagne',  rendement: 0.9 },
        { id: 'g_sang_os',        nom: 'sanglier avec os',                   rendement: 0.95 },
        { id: 'g_sang_chair',     nom: 'sanglier chair',                     rendement: 1 },
        { id: 'g_sang_foie',      nom: 'sanglier foie',                      rendement: 1 },
        { id: 'g_cerf_os',        nom: 'cerf avec os',                       rendement: 0.8 },
        { id: 'g_cerf_chair',     nom: 'cerf chair',                         rendement: 1 },
        { id: 'g_faisan_os',      nom: 'faisan avec os',                     rendement: 0.52 },
        { id: 'g_faisan_sansos',  nom: 'faisan sans os',                     rendement: 0.95 },
        { id: 'g_canard',         nom: 'canard',                             rendement: 0.6 },
        { id: 'g_lapin_os',       nom: 'lapin avec os',                      rendement: 0.6 },
        { id: 'g_lapin_sansos',   nom: 'lapin sans os',                      rendement: 1 },
        { id: 'g_becasse',        nom: 'bécasse (250 g pièce)',              rendement: 0.5 },
        { id: 'g_perdrix',        nom: 'perdrix / pigeon entier',            rendement: 0.5 },
      ],

      /* Recettes (10 pâtés) */
      recettes: [
        { id: 'r_lievre',            key: 'lievre',            nom: 'Pâté de lièvre' },
        { id: 'r_chevreuil',         key: 'chevreuil',         nom: 'Pâté de chevreuil' },
        { id: 'r_sanglier_camp',     key: 'sanglier_camp',     nom: 'Pâté de sanglier (campagne)' },
        { id: 'r_faisan',            key: 'faisan',            nom: 'Pâté de faisan' },
        { id: 'r_daube',             key: 'daube',             nom: 'Daube de sanglier' },
        { id: 'r_foie_sanglier',     key: 'foie_sanglier',     nom: 'Pâté de foie de sanglier' },
        { id: 'r_foie_chevreuil',    key: 'foie_chevreuil',    nom: 'Pâté de foie de chevreuil' },
        { id: 'r_rillette_perdreaux',key: 'rillette_perdreaux',nom: 'Rillette de perdreaux' },
        { id: 'r_rillette_lievre',   key: 'rillette_lievre',   nom: 'Rillette de lièvre' },
        { id: 'r_civet',             key: 'civet',             nom: 'Civet de chevreuil' },
      ],

      /* Quel(s) gibier(s) net(s) composent la viande de base de chaque pâté
         (onglet Production, ligne 6). Vide = pas de viande de base pour l'instant. */
      baseMeatMap: {
        lievre:            ['g_lievre_os', 'g_lievre_sansos'],
        chevreuil:         ['g_chev_chair', 'g_chev_foie'],
        sanglier_camp:     ['g_sang_chair'],
        faisan:            ['g_faisan_os', 'g_faisan_sansos'],
        daube:             [],
        foie_sanglier:     ['g_sang_foie', 'g_foiechev_camp'],
        foie_chevreuil:    [],
        rillette_perdreaux:[],
        rillette_lievre:   ['g_lievre_rillette'],
        civet:             ['g_chev_epaule'],
      },

      /* Ingrédients : unité, prix, catégorie + doses par kg de viande (coefs par recette) */
      ingredients: [
        { id:'i01', nom:'lièvre',                                    unite:'kg', prix:0,    cat:'Gibier', coefs:{ lievre:1, rillette_lievre:1 } },
        { id:'i02', nom:'chevreuil pâté',                            unite:'kg', prix:0,    cat:'Gibier', coefs:{ chevreuil:1 } },
        { id:'i03', nom:'foie de chevreuil (intégré au chevreuil)',  unite:'kg', prix:0,    cat:'Gibier', coefs:{ foie_sanglier:1.8, foie_chevreuil:1 } },
        { id:'i04', nom:'sanglier',                                  unite:'kg', prix:0,    cat:'Gibier', coefs:{ daube:1 } },
        { id:'i05', nom:'foie de sanglier',                          unite:'kg', prix:0,    cat:'Gibier', coefs:{ sanglier_camp:1, foie_sanglier:1 } },
        { id:'i06', nom:'foie chevreuil (intégré au pâté campagne)', unite:'kg', prix:0,    cat:'Gibier', coefs:{} },
        { id:'i07', nom:'faisan',                                    unite:'kg', prix:0,    cat:'Gibier', coefs:{ faisan:1 } },
        { id:'i08', nom:'canard',                                    unite:'kg', prix:0,    cat:'Gibier', coefs:{} },
        { id:'i09', nom:'lapin',                                     unite:'kg', prix:0,    cat:'Gibier', coefs:{} },
        { id:'i10', nom:'bécasse',                                   unite:'kg', prix:0,    cat:'Gibier', coefs:{} },
        { id:'i11', nom:'perdreaux',                                 unite:'kg', prix:0,    cat:'Gibier', coefs:{ rillette_perdreaux:1 } },
        { id:'i12', nom:'chevreuil civet',                           unite:'kg', prix:0,    cat:'Gibier', coefs:{ civet:1 } },
        { id:'i13', nom:'gorge de porc',                             unite:'kg', prix:3.2,  cat:'Achat',  coefs:{ lievre:0.6, chevreuil:0.6, sanglier_camp:1, faisan:0.2, foie_sanglier:1, foie_chevreuil:0.8, rillette_lievre:0.5 } },
        { id:'i14', nom:'échine de porc',                            unite:'kg', prix:8,    cat:'Achat',  coefs:{ daube:0.2, foie_chevreuil:1.5 } },
        { id:'i15', nom:'lard gras',                                 unite:'kg', prix:12,   cat:'Achat',  coefs:{} },
        { id:'i16', nom:'poitrine de porc',                          unite:'kg', prix:8,    cat:'Achat',  coefs:{ rillette_perdreaux:0.65, civet:0.4 } },
        { id:'i17', nom:'poitrine fumée',                            unite:'kg', prix:12.5, cat:'Achat',  coefs:{} },
        { id:'i18', nom:'chair à saucisse',                          unite:'kg', prix:10,   cat:'Achat',  coefs:{} },
        { id:'i19', nom:'barde',                                     unite:'m2', prix:20,   cat:'Achat',  coefs:{} },
        { id:'i20', nom:'veau poitrine',                             unite:'kg', prix:16,   cat:'Achat',  coefs:{ faisan:0.25 } },
        { id:'i21', nom:'foie de volailles',                         unite:'kg', prix:15,   cat:'Achat',  coefs:{} },
        { id:'i22', nom:'saindoux',                                  unite:'kg', prix:6,    cat:'Achat',  coefs:{ rillette_perdreaux:0.5, rillette_lievre:0.35 } },
        { id:'i23', nom:'sel',                                       unite:'kg', prix:1.2,  cat:'Achat',  coefs:{ lievre:0.012, chevreuil:0.012, sanglier_camp:0.013, faisan:0.012, daube:0.012, foie_sanglier:0.012, foie_chevreuil:0.012, rillette_perdreaux:0.012, rillette_lievre:0.012, civet:0.012 } },
        { id:'i24', nom:'poivre',                                    unite:'kg', prix:30,   cat:'Achat',  coefs:{ lievre:0.002, chevreuil:0.002, sanglier_camp:0.002, faisan:0.002, daube:0.002, foie_sanglier:0.002, foie_chevreuil:0.002, rillette_perdreaux:0.002, rillette_lievre:0.002, civet:0.002 } },
        { id:'i25', nom:'sucre',                                     unite:'kg', prix:2,    cat:'Achat',  coefs:{ lievre:0.005, chevreuil:0.005, sanglier_camp:0.005, faisan:0.005, foie_sanglier:0.005, foie_chevreuil:0.005, rillette_perdreaux:0.005 } },
        { id:'i26', nom:'4 épices',                                  unite:'g',  prix:20,   cat:'Achat',  coefs:{ lievre:0.3, chevreuil:0.3, sanglier_camp:1, faisan:0.3, foie_sanglier:0.3, foie_chevreuil:1, rillette_perdreaux:1, rillette_lievre:1, civet:0.3 } },
        { id:'i27', nom:'poivre vert',                               unite:'g',  prix:50,   cat:'Achat',  coefs:{ sanglier_camp:5, foie_sanglier:5 } },
        { id:'i28', nom:'clous de girofle',                          unite:'u',  prix:20,   cat:'Achat',  coefs:{ daube:3 } },
        { id:'i29', nom:"huile d'olive",                             unite:'l',  prix:8,    cat:'Achat',  coefs:{ daube:0.1, civet:0.01 } },
        { id:'i30', nom:'vinaigre de vin',                           unite:'l',  prix:4,    cat:'Achat',  coefs:{} },
        { id:'i31', nom:'cacao Van Houten',                          unite:'CS', prix:0.02, cat:'Achat',  coefs:{ chevreuil:0.5 } },
        { id:'i32', nom:'carottes pour bocaux',                      unite:'u',  prix:0.3,  cat:'Achat',  coefs:{ lievre:0.5, chevreuil:0.5, sanglier_camp:0.5, faisan:0.5, foie_sanglier:0.5, foie_chevreuil:0.5 } },
        { id:'i33', nom:'carottes nouvelles',                        unite:'kg', prix:3.5,  cat:'Achat',  coefs:{ daube:1, rillette_perdreaux:0.1, rillette_lievre:0.15, civet:0.75 } },
        { id:'i34', nom:'gingembre',                                 unite:'CC', prix:0,    cat:'Achat',  coefs:{ sanglier_camp:1 } },
        { id:'i35', nom:'baies de genièvre',                         unite:'',   prix:0,    cat:'Achat',  coefs:{ rillette_perdreaux:1 } },
        { id:'i36', nom:'pistaches',                                 unite:'kg', prix:30,   cat:'Achat',  coefs:{} },
        { id:'i37', nom:'céleri branche',                            unite:'br', prix:0.5,  cat:'Achat',  coefs:{ daube:4, civet:2 } },
        { id:'i38', nom:'champignons',                               unite:'kg', prix:3,    cat:'Achat',  coefs:{ daube:0.2 } },
        { id:'i39', nom:'tomates',                                   unite:'kg', prix:4.5,  cat:'Achat',  coefs:{ daube:0.3 } },
        { id:'i40', nom:'olives noires niçoises',                    unite:'kg', prix:20,   cat:'Achat',  coefs:{ daube:0.07 } },
        { id:'i41', nom:'persil',                                    unite:'kg', prix:3,    cat:'Achat',  coefs:{ daube:0.015 } },
        { id:'i42', nom:'oranges bio',                               unite:'u',  prix:0.3,  cat:'Achat',  coefs:{ daube:1 } },
        { id:'i43', nom:'citrons bio',                               unite:'u',  prix:0.5,  cat:'Achat',  coefs:{ daube:1 } },
        { id:'i44', nom:'échalottes',                                unite:'u',  prix:0.15, cat:'Achat',  coefs:{} },
        { id:'i45', nom:'ail frais',                                 unite:'gs', prix:1,    cat:'Achat',  coefs:{ daube:6, rillette_perdreaux:2 } },
        { id:'i46', nom:'oignons',                                   unite:'kg', prix:0.2,  cat:'Achat',  coefs:{ rillette_perdreaux:0.3, rillette_lievre:1, civet:0.15 } },
        { id:'i47', nom:'oignons nouveaux',                          unite:'kg', prix:5,    cat:'Achat',  coefs:{ daube:0.2 } },
        { id:'i48', nom:'thym',                                      unite:'br', prix:0,    cat:'Achat',  coefs:{ lievre:5, chevreuil:5, sanglier_camp:5, faisan:5, daube:1, foie_sanglier:5, foie_chevreuil:5, rillette_perdreaux:1, rillette_lievre:1, civet:2 } },
        { id:'i49', nom:'laurier',                                   unite:'fl', prix:0,    cat:'Achat',  coefs:{ lievre:1, chevreuil:1, sanglier_camp:1, faisan:1, daube:2, foie_sanglier:1, foie_chevreuil:1, rillette_perdreaux:0.5, rillette_lievre:0.5, civet:1 } },
        { id:'i50', nom:'vin blanc chenin',                          unite:'l',  prix:10,   cat:'Achat',  coefs:{ faisan:0.12, daube:0.7, foie_sanglier:0.1, rillette_perdreaux:0.2, rillette_lievre:0.75 } },
        { id:'i51', nom:'vin rouge languedoc',                       unite:'l',  prix:10,   cat:'Achat',  coefs:{ lievre:0.12, chevreuil:0.07, sanglier_camp:0.15, foie_chevreuil:0.05, civet:0.4 } },
        { id:'i52', nom:'cognac / armagnac',                         unite:'l',  prix:35,   cat:'Achat',  coefs:{ lievre:0.03, chevreuil:0.03, sanglier_camp:0.04, daube:0.03, foie_sanglier:0.07, foie_chevreuil:0.07, rillette_perdreaux:0.05, rillette_lievre:0.02, civet:0.02 } },
        { id:'i53', nom:'alcool blanc de fruit',                     unite:'l',  prix:45,   cat:'Achat',  coefs:{ faisan:0.03 } },
        { id:'i54', nom:'porto',                                     unite:'l',  prix:25,   cat:'Achat',  coefs:{ chevreuil:0.045 } },
      ],

      /* Apports de gibier (kg brut) par chasseur — onglet Stocks Gibier */
      stocks: {
        g_lievre_os:     { p_vincent:4.33, p_denis:4.45, p_jb:1.8 },
        g_chev_epaule:   { p_vincent:2.63, p_denis:4.53, p_olivier:3.53, p_frederic:1.78 },
        g_chev_chair:    { p_vincent:5.3, p_denis:2.71, p_jb:2.9, p_olivier:0.973, p_frederic:1.4 },
        g_chev_foie:     { p_vincent:0.67, p_jb:0.7 },
        g_foiechev_camp: { p_denis:2.6, p_frederic:2.9 },
        g_sang_os:       { p_vincent:2.9, p_denis:4.8, p_frederic:5.6 },
        g_sang_foie:     { p_frederic:2 },
        g_faisan_os:     { p_vincent:1.9, p_denis:3.84, p_jb:5.8, p_olivier:0.95, p_frederic:12.4 },
        g_faisan_sansos: { p_jb:0.8 },
        g_becasse:       { p_denis:1.25, p_jb:2.5, p_olivier:0.75, p_frederic:1.5 },
        g_perdrix:       { p_jb:1.6 },
      },

      /* Répartition en bocaux saisie (Production) — vide = 0 partout au départ */
      bocaux: {},

      /* Liste de courses : "en stock", "qui", "statut" par ingrédient */
      courses: {},

      /* Bocaux vides en stock (onglet Liste de courses) */
      bocauxStock: { f110:5, f180:54, f315:118, f450:21, f675:13, f900:0, f1350:0 },

      /* Comptes réels de la journée (Budget & Comptes) */
      depenses: [
        { id:'d1', qui:'benoit',  poste:'achat bocaux',                              montant:182.28 },
        { id:'d2', qui:'vincent', poste:'foie de volaille et mirabelle',             montant:34.24 },
        { id:'d3', qui:'thomas',  poste:'étiquettes',                                montant:10 },
        { id:'d4', qui:'fred',    poste:'petit complément du jour J (Intermarché)',  montant:17.08 },
        { id:'d5', qui:'fred',    poste:'gorge de porc (Pruvost Leroy)',             montant:103.22 },
        { id:'d6', qui:'fred',    poste:'joints (Gamm Vert)',                        montant:42.73 },
        { id:'d7', qui:'fred',    poste:'vins, armagnac, épices, veau (Intermarché)',montant:140.19 },
      ],
      remboursements: [
        { id:'rb1', qui:'olivier', montant:75.68, a:'benoit' },
        { id:'rb2', qui:'jb',      montant:75.68, a:'fred' },
        { id:'rb3', qui:'antoine', montant:75.68, a:'fred' },
        { id:'rb4', qui:'denis',   montant:75.68, a:'fred' },
        { id:'rb5', qui:'vincent', montant:30.92, a:'benoit' },
        { id:'rb6', qui:'(à régler)', montant:10, a:'thomas' },
      ],

      /* Archives des années passées (photos + récap). Vide au départ. */
      annees: [],
    };
  }

  return { build };
})();
