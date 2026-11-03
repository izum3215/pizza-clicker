(() => {
  'use strict';

  const SAVE_KEY = 'pizzaClickerSaveV2';
  const PLATE_CAP = 10;
  const VISUAL_CAP = 42;
  const COST_GROWTH = 1.15;
  const SELL_RATE = 0.5;
  const CRUST_DIVISOR = 100;
  const PRESTIGE_BONUS = 0.01;
  const MOZZ_DURATION = 24 * 60 * 60 * 1000;
  const MAX_BUILDING_LEVEL = 10;
  const MINI_COOLDOWN = 5 * 60 * 1000;
  const CULT_COOLDOWN = 3 * 60 * 1000;
  const VALORANT_COST = 5000;
  const MARKET_INTERVAL = 60 * 1000;
  const MARKET_HISTORY = 40;
  const MARKET_BASE = { tomato: 2e6, cheese: 5e6, pepperoni: 10e6 };
  const MARKET_COLORS = { tomato: '#4ee0c8', cheese: '#ffd34e', pepperoni: '#ff4655' };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const INGREDIENT_ORDER = ['tomato', 'cheese', 'pepperoni'];

  const INGREDIENTS = {
    tomato: {
      id: 'tomato',
      name: 'Томатная паста',
      short: 'Томат',
      upgradeName: 'Помидоры, помидоры, помидоры',
      upgradeDesc: 'Маленький лёгкий тюбик. Красная основа пиццы.',
      unlock: 100,
      cost: 100,
      color: '#c93b2b',
      r: 8,
      gravity: 1.18,
      restitution: 0.62,
      mass: 0.8,
      tag: 'маленький · лёгкий · точный'
    },
    cheese: {
      id: 'cheese',
      name: 'Сыр',
      short: 'Сыр',
      upgradeName: 'Луна',
      upgradeDesc: 'Круглый, средний, с вырезом. Тяжеловат.',
      unlock: 1000,
      cost: 1000,
      color: '#e8c04b',
      r: 12,
      gravity: 0.97,
      restitution: 0.5,
      mass: 1.7,
      tag: 'средний · тяжёлый'
    },
    pepperoni: {
      id: 'pepperoni',
      name: 'Пепперони',
      short: 'Пепперони',
      upgradeName: 'Это не мясо',
      upgradeDesc: 'Длинная, тонкая, лёгкая. Кружочки колбасы на пицце.',
      unlock: 10000,
      cost: 10000,
      color: '#a83226',
      r: 15,
      gravity: 0.88,
      restitution: 0.68,
      mass: 1.05,
      tag: 'большой · прыгучий'
    }
  };

  const BUILDINGS = {
    slice: {
      id: 'slice',
      name: 'Кусок пиццы',
      desc: '+1 к силе клика',
      baseCost: 15
    },
    cook: {
      id: 'cook',
      name: 'Повар',
      desc: '+1 кусок в секунду, ×2 за каждый рецепт',
      baseCost: 100
    },
    pizzeria: {
      id: 'pizzeria',
      name: 'Пиццерия',
      desc: '×1,5 к производству кусков в секунду за каждую',
      baseCost: 1000
    },
    chef: {
      id: 'chef',
      name: 'Шеф-повар',
      desc: 'Придумывает 1 рецепт в редакторе',
      baseCost: 500
    }
  };

  const BUILDING_ORDER = ['slice', 'cook', 'pizzeria', 'chef'];

  const MINIGAMES = {
    slice: {
      id: 'slice',
      name: 'НАРЕЗКА',
      sub: 'Нарежь как можно больше кусков за 6 секунд. Каждый разрез приносит куски, а 25 разрезов дадут бонус к клику.',
      cooldown: MINI_COOLDOWN
    },
    cook: {
      id: 'cook',
      name: 'ИДЕАЛЬНЫЙ СОУС',
      sub: 'Останови бегунок в зелёной зоне. Чем точнее — тем сильнее временный бонус к производству.',
      cooldown: MINI_COOLDOWN
    },
    pizzeria: {
      id: 'pizzeria',
      name: 'ОЧЕРЕДЬ ГОСТЕЙ',
      sub: 'Успей обслужить гостей за 12 секунд. Полная очередь даёт бонус к производству.',
      cooldown: MINI_COOLDOWN
    },
    chef: {
      id: 'chef',
      name: 'ДЕГУСТАЦИЯ',
      sub: 'Найди отличающийся ингредиент три раза подряд. Идеальный результат даёт бесплатный заряд редактора.',
      cooldown: MINI_COOLDOWN
    }
  };

  const HEAVENLY_ORDER = [
    'spark', 'dough', 'hands',
    'oven', 'apprentice', 'crusty',
    'shop', 'cheflegacy', 'secret',
    'empire', 'book', 'infinity',
    'golden', 'throne', 'eternal'
  ];

  const HEAVENLY = {
    spark: {
      id: 'spark', name: 'Искра печи', desc: '+5% к производству кусков',
      cost: 1, req: [], tier: 0, col: 1, icon: 'flame'
    },
    dough: {
      id: 'dough', name: 'Живое тесто', desc: 'Старт со 100 кусками',
      cost: 2, req: [], tier: 0, col: 0, icon: 'dough'
    },
    hands: {
      id: 'hands', name: 'Тёплые руки', desc: '+1 к силе клика',
      cost: 3, req: [], tier: 0, col: 2, icon: 'hand'
    },
    oven: {
      id: 'oven', name: 'Тёплая печь', desc: '+10% к производству кусков',
      cost: 4, req: ['spark'], tier: 1, col: 1, icon: 'flame'
    },
    apprentice: {
      id: 'apprentice', name: 'Пекарь-стажёр', desc: 'Старт с 1 поваром',
      cost: 5, req: ['dough'], tier: 1, col: 0, icon: 'cook'
    },
    crusty: {
      id: 'crusty', name: 'Хрустящая корочка', desc: '+15% корочек за восхождение',
      cost: 7, req: ['hands'], tier: 1, col: 2, icon: 'crust'
    },
    shop: {
      id: 'shop', name: 'Витрина', desc: 'Повара на 15% дешевле',
      cost: 10, req: ['oven'], tier: 2, col: 1, icon: 'pizzeria'
    },
    cheflegacy: {
      id: 'cheflegacy', name: 'Шеф-легенда', desc: 'Старт с шефом и зарядом',
      cost: 12, req: ['apprentice'], tier: 2, col: 0, icon: 'chef'
    },
    secret: {
      id: 'secret', name: 'Секретный соус', desc: '+25% к производству кусков',
      cost: 15, req: ['crusty'], tier: 2, col: 2, icon: 'pepperoni'
    },
    empire: {
      id: 'empire', name: 'Пиццерийная империя', desc: 'Пиццерии на 20% дешевле',
      cost: 20, req: ['shop'], tier: 3, col: 1, icon: 'pizzeria'
    },
    book: {
      id: 'book', name: 'Вечная книга', desc: 'Прокачки и рецепты остаются',
      cost: 25, req: ['cheflegacy'], tier: 3, col: 0, icon: 'book'
    },
    infinity: {
      id: 'infinity', name: 'Печь бесконечности', desc: '×1,5 к производству кусков',
      cost: 35, req: ['secret'], tier: 3, col: 2, icon: 'flame'
    },
    golden: {
      id: 'golden', name: 'Золотая тарелка', desc: '+2 к силе клика',
      cost: 45, req: ['book'], tier: 4, col: 0, icon: 'gold'
    },
    throne: {
      id: 'throne', name: 'Корочковый трон', desc: '+50% корочек за восхождение',
      cost: 60, req: ['empire', 'secret'], tier: 4, col: 1, icon: 'crust'
    },
    eternal: {
      id: 'eternal', name: 'Вечный рецепт', desc: '+1 ингредиент в рецепте',
      cost: 80, req: ['infinity'], tier: 4, col: 2, icon: 'pizza'
    }
  };

  const UPGRADES = {
    tomato: {
      id: 'tomato',
      kind: 'ingredient',
      unlock: 100,
      cost: 100
    },
    cheese: {
      id: 'cheese',
      kind: 'ingredient',
      unlock: 1000,
      cost: 1000
    },
    pepperoni: {
      id: 'pepperoni',
      kind: 'ingredient',
      unlock: 10000,
      cost: 10000
    },
    size2: {
      id: 'size2',
      kind: 'size',
      name: 'Двойная начинка',
      desc: '+1 ингредиент в рецепте',
      cost: 1500,
      requires: () => unlockedIngredients().length >= 2 && state.recipes.length >= 1,
      reqText: 'Нужно 2 ингредиента и 1 рецепт'
    },
    size3: {
      id: 'size3',
      kind: 'size',
      name: 'Тройная угроза',
      desc: '+1 ингредиент в рецепте',
      cost: 15000,
      requires: () => unlockedIngredients().length >= 3 && state.recipes.length >= 3,
      reqText: 'Нужно 3 ингредиента и 3 рецепта'
    }
  };

  const RECIPE_NAMES = {
    tomato: 'Красная основа',
    cheese: 'Лунная',
    pepperoni: 'Это не мясо',
    'tomato+cheese': 'Маргарита',
    'tomato+pepperoni': 'Диабло',
    'cheese+pepperoni': 'Мясная луна',
    'tomato+cheese+pepperoni': 'Шедевр шефа'
  };

  const PIZZA_SKINS = {
    classic: {
      id: 'classic',
      name: 'Классика',
      tagline: 'Та самая пицца из детства. Ничего лишнего — только тесто, соус и сыр.',
      dough: 'классическое',
      mood: 'ностальгическое',
      palette: {
        crustEdge: '#4a1d0e', crustLight: '#f2b95c', crustDark: '#a85a1f', crustMid: '#d98a32',
        crustSpeck: '#8f4517', crustSpeckLight: '#ffd27a',
        sauceDark: '#8e2518', sauceLight: '#b33a24',
        cheeseLight: '#ffe27a', cheeseDark: '#d99b26', cheeseMid: '#f5c845',
        cheeseSpeck: '#e8b234', cheeseSpeck2: '#ffdd6b', cheeseOuter: '#e0a92e',
        sliceLine: '#d29a24'
      }
    },
    sons4: {
      id: 'sons4',
      name: 'Пицца 4 сына',
      tagline: 'Четыре сына, четыре характера и ни одного лишнего куска.',
      dough: 'сырное',
      mood: 'семейное',
      decor: 'sons4',
      palette: {
        crustEdge: '#4a1d0e', crustLight: '#f6c169', crustDark: '#a85a1f', crustMid: '#dd8f36',
        crustSpeck: '#8f4517', crustSpeckLight: '#ffe0a0',
        sauceDark: '#8e2518', sauceLight: '#c2472e',
        cheeseLight: '#fffce8', cheeseDark: '#e8cf8a', cheeseMid: '#fff3c9',
        cheeseSpeck: '#f0dfa8', cheeseSpeck2: '#fffdf5', cheeseOuter: '#edd79a',
        sliceLine: '#d8bb7a'
      }
    },
    pigs22: {
      id: 'pigs22',
      name: 'Пицца 22 свина',
      tagline: 'Двадцать два пятачка смотрят на тебя. Каждый хочет добавки.',
      dough: 'пятачковое',
      mood: 'хрюкающее',
      decor: 'pigs22',
      palette: {
        crustEdge: '#4a1d0e', crustLight: '#f2b95c', crustDark: '#a85a1f', crustMid: '#d98a32',
        crustSpeck: '#8f4517', crustSpeckLight: '#ffd27a',
        sauceDark: '#a8324a', sauceLight: '#d4586c',
        cheeseLight: '#ffdde2', cheeseDark: '#e89aa8', cheeseMid: '#ffc4ce',
        cheeseSpeck: '#f2a6b4', cheeseSpeck2: '#ffe9ed', cheeseOuter: '#eda4b0',
        sliceLine: '#e092a2'
      }
    },
    pigpig: {
      id: 'pigpig',
      name: 'Пицца свин свиньи',
      tagline: 'Свин внутри свиньи. Свин во сне и наяву. Не задавай вопросов.',
      dough: 'свинское',
      mood: 'подозрительное',
      decor: 'pigpig',
      palette: {
        crustEdge: '#4a1d0e', crustLight: '#f2b95c', crustDark: '#a85a1f', crustMid: '#d98a32',
        crustSpeck: '#8f4517', crustSpeckLight: '#ffd27a',
        sauceDark: '#b03a58', sauceLight: '#e06a86',
        cheeseLight: '#ffe6ea', cheeseDark: '#eaa0b4', cheeseMid: '#ffccd8',
        cheeseSpeck: '#f2a6b4', cheeseSpeck2: '#fff0f3', cheeseOuter: '#eda4b0',
        sliceLine: '#e092a2'
      }
    },
    vatsai: {
      id: 'vatsai',
      name: 'Пицца вацай нема',
      tagline: 'Вацай нема — значит, можно ещё кусочек. Только очень тихо.',
      dough: 'ночное',
      mood: 'сонное',
      decor: 'vatsai',
      palette: {
        crustEdge: '#2a1220', crustLight: '#7a5570', crustDark: '#4a2c4a', crustMid: '#5e3a5c',
        crustSpeck: '#3a1c34', crustSpeckLight: '#a67c9c',
        sauceDark: '#1e1430', sauceLight: '#2f2448',
        cheeseLight: '#5a4a7a', cheeseDark: '#332a52', cheeseMid: '#463a68',
        cheeseSpeck: '#3a3058', cheeseSpeck2: '#6a5a8a', cheeseOuter: '#3b3158',
        sliceLine: '#6a5a8a'
      }
    },
    kids: {
      id: 'kids',
      name: 'Пицца для детей лучших',
      tagline: 'Для детей лучших. И для тебя, если хорошо себя вёл.',
      dough: 'праздничное',
      mood: 'радужное',
      decor: 'kids',
      palette: {
        crustEdge: '#5a2a10', crustLight: '#ffcf6b', crustDark: '#c26a1e', crustMid: '#f09a32',
        crustSpeck: '#a85818', crustSpeckLight: '#ffe6a0',
        sauceDark: '#c23a2a', sauceLight: '#f2604a',
        cheeseLight: '#fff2a8', cheeseDark: '#f2c94e', cheeseMid: '#ffe27a',
        cheeseSpeck: '#f5d35c', cheeseSpeck2: '#fff8c8', cheeseOuter: '#efca5a',
        sliceLine: '#e8b93e'
      }
    },
    burger: {
      id: 'burger',
      name: 'Пицца-бургер',
      tagline: 'Пицца решила стать бургером. Булочка, салат, сыр и котлета на месте.',
      dough: 'булочное',
      mood: 'сытное',
      custom: 'burger'
    }
  };

  const SKIN_ORDER = ['classic', 'sons4', 'pigs22', 'pigpig', 'vatsai', 'kids', 'burger'];

  function defaultMarket() {
    const market = {};
    for (const id of INGREDIENT_ORDER) {
      const base = MARKET_BASE[id];
      market[id] = {
        price: base,
        prev: base,
        stock: 0,
        lock: '',
        history: Array.from({ length: 12 }, () => base)
      };
    }
    return market;
  }

  function defaultState() {
    return {
      slices: 0,
      totalSlices: 0,
      clicksOwned: 0,
      cooks: 0,
      pizzerias: 0,
      chefs: 0,
      chefCharges: 0,
      upgrades: [],
      recipes: [],
      crusts: 0,
      crustsEarned: 0,
      ascensions: 0,
      heavenly: [],
      mozzarella: 0,
      lumpStart: 0,
      levels: { slice: 0, cook: 0, pizzeria: 0, chef: 0 },
      buffs: [],
      miniCooldowns: { slice: 0, cook: 0, pizzeria: 0, chef: 0 },
      eventUpgrades: [],
      eventCooldowns: { cult: 0 },
      marketUpdatedAt: Date.now(),
      market: defaultMarket(),
      skin: 'classic'
    };
  }

  let state = defaultState();

  const els = {
    scene: document.getElementById('scene'),
    pizza: document.getElementById('pizza'),
    pizzaWrap: document.getElementById('pizzaWrap'),
    count: document.getElementById('count'),
    countWord: document.getElementById('countWord'),
    cps: document.getElementById('cps'),
    clickPower: document.getElementById('clickPower'),
    total: document.getElementById('total'),
    multiplier: document.getElementById('multiplier'),
    prestigeLevel: document.getElementById('prestigeLevel'),
    prestigeBonus: document.getElementById('prestigeBonus'),
    crustFill: document.getElementById('crustFill'),
    crusts: document.getElementById('crusts'),
    crustIcon: document.getElementById('crustIcon'),
    treeBtn: document.getElementById('treeBtn'),
    mozzarella: document.getElementById('mozzarella'),
    mozzIcon: document.getElementById('mozzIcon'),
    mozzBtn: document.getElementById('mozzBtn'),
    mozzFillHud: document.getElementById('mozzFillHud'),
    buffRow: document.getElementById('buffRow'),
    buffText: document.getElementById('buffText'),
    store: document.getElementById('store'),
    buildings: document.getElementById('buildings'),
    upgrades: document.getElementById('upgrades'),
    heavenlySection: document.getElementById('heavenlySection'),
    eventsSection: document.getElementById('eventsSection'),
    buyModeBtn: document.getElementById('buyModeBtn'),
    sellModeBtn: document.getElementById('sellModeBtn'),
    qtyBtns: Array.from(document.querySelectorAll('.qty-btn')),
    bookBtn: document.getElementById('bookBtn'),
    recipeCount: document.getElementById('recipeCount'),
    editorBtn: document.getElementById('editorBtn'),
    chargeCount: document.getElementById('chargeCount'),
    plateStatus: document.getElementById('plateStatus'),
    plateStatusWrap: document.getElementById('plateStatusWrap'),
    hint: document.getElementById('hint'),
    floaters: document.getElementById('floaters'),
    logoIcon: document.getElementById('logoIcon'),
    resetBtn: document.getElementById('resetBtn'),

    ascendModal: document.getElementById('ascendModal'),
    ascendClose: document.getElementById('ascendClose'),
    ascendBtn: document.getElementById('ascendBtn'),
    ascendLevel: document.getElementById('ascendLevel'),
    ascendBonus: document.getElementById('ascendBonus'),
    ascendCrusts: document.getElementById('ascendCrusts'),
    ascendGain: document.getElementById('ascendGain'),
    treeCanvas: document.getElementById('treeCanvas'),
    treeLines: document.getElementById('treeLines'),

    mozzModal: document.getElementById('mozzModal'),
    mozzClose: document.getElementById('mozzClose'),
    mozzBig: document.getElementById('mozzBig'),
    mozzCount: document.getElementById('mozzCount'),
    mozzStatus: document.getElementById('mozzStatus'),
    mozzFill: document.getElementById('mozzFill'),
    mozzBuildings: document.getElementById('mozzBuildings'),

    miniModal: document.getElementById('miniModal'),
    miniClose: document.getElementById('miniClose'),
    miniTitle: document.getElementById('miniTitle'),
    miniSub: document.getElementById('miniSub'),
    miniBody: document.getElementById('miniBody'),

    marketModal: document.getElementById('marketModal'),
    marketClose: document.getElementById('marketClose'),
    marketGrid: document.getElementById('marketGrid'),
    marketSlices: document.getElementById('marketSlices'),
    marketDelta: document.getElementById('marketDelta'),
    marketChart: document.getElementById('marketChart'),
    marketLegend: document.getElementById('marketLegend'),
    marketNext: document.getElementById('marketNext'),

    eventLayer: document.getElementById('eventLayer'),
    eventStage: document.getElementById('eventStage'),
    eventStatus: document.getElementById('eventStatus'),
    eventStop: document.getElementById('eventStop'),

    editorModal: document.getElementById('editorModal'),
    editorClose: document.getElementById('editorClose'),
    editorIngredients: document.getElementById('editorIngredients'),
    editorResult: document.getElementById('editorResult'),
    slotCount: document.getElementById('slotCount'),
    raceBtn: document.getElementById('raceBtn'),
    acceptBtn: document.getElementById('acceptBtn'),
    plinko: document.getElementById('plinko'),

    bookModal: document.getElementById('bookModal'),
    bookClose: document.getElementById('bookClose'),
    bookSummary: document.getElementById('bookSummary'),
    bookGrid: document.getElementById('bookGrid'),

    skinsBtn: document.getElementById('skinsBtn'),
    skinModal: document.getElementById('skinModal'),
    skinClose: document.getElementById('skinClose'),
    skinPreview: document.getElementById('skinPreview'),
    skinPrev: document.getElementById('skinPrev'),
    skinNext: document.getElementById('skinNext'),
    skinBadge: document.getElementById('skinBadge'),
    skinName: document.getElementById('skinName'),
    skinTagline: document.getElementById('skinTagline'),
    skinDough: document.getElementById('skinDough'),
    skinMood: document.getElementById('skinMood'),
    skinApply: document.getElementById('skinApply'),
    skinRail: document.getElementById('skinRail'),

    confirmModal: document.getElementById('confirmModal'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmText: document.getElementById('confirmText'),
    confirmNo: document.getElementById('confirmNo'),
    confirmYes: document.getElementById('confirmYes'),
    toast: document.getElementById('toast')
  };

  const sceneCtx = els.scene.getContext('2d');
  const pizzaCtx = els.pizza.getContext('2d');
  const logoCtx = els.logoIcon.getContext('2d');
  const plinkoCtx = els.plinko.getContext('2d');

  const pizzaSpriteCache = new Map();
  const sliceSpriteCache = new Map();
  const iconCache = new Map();

  let layout = null;
  let plateSprite = null;
  let plateShadowSprite = null;
  let dpr = 1;
  let lastFrame = performance.now();
  let lastTextUpdate = 0;
  let lastSignatureCheck = 0;
  let lastSave = 0;
  let lastSlowTick = 0;
  let lastCountText = '';
  let lastStoreSignature = '';
  let hasClicked = false;
  let displayRecipeKey = 'plain';
  let lastRecipeSwap = performance.now();
  let visualSlices = [];
  let storeMode = 'buy';
  let storeQty = 1;

  const mini = {
    id: '',
    active: false,
    raf: 0,
    timers: [],
    pos: 0,
    score: 0,
    round: 0,
    odd: 0,
    clicks: 0,
    roundTimer: 0
  };

  let cultEvent = {
    active: false,
    wave: 0,
    hp: 0,
    maxHp: 0,
    stolen: 0,
    tick: 0,
    escape: 0,
    next: 0,
    el: null
  };

  const unlockNotified = { tomato: false, cheese: false, pepperoni: false };

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  function formatNumber(n) {
    n = Math.max(0, n);
    if (!isFinite(n)) return '∞';
    if (n < 1000) return String(Math.floor(n));

    const units = [
      [1e18, 'квинтлн'],
      [1e15, 'квадрлн'],
      [1e12, 'трлн'],
      [1e9, 'млрд'],
      [1e6, 'млн'],
      [1e3, 'тыс.']
    ];

    for (const [value, suffix] of units) {
      if (n >= value) {
        const val = n / value;
        const digits = val >= 100 ? 0 : val >= 10 ? 1 : 2;
        let text = val.toFixed(digits).replace('.', ',');
        if (text.includes(',')) text = text.replace(/,?0+$/, '');
        return text + ' ' + suffix;
      }
    }

    return String(Math.floor(n));
  }

  function pluralSlices(n) {
    const mod100 = Math.floor(Math.abs(n)) % 100;
    const mod10 = mod100 % 10;
    if (mod100 > 10 && mod100 < 20) return 'кусков';
    if (mod10 === 1) return 'кусок';
    if (mod10 >= 2 && mod10 <= 4) return 'куска';
    return 'кусков';
  }

  function pluralCrusts(n) {
    const mod100 = Math.floor(Math.abs(n)) % 100;
    const mod10 = mod100 % 10;
    if (mod100 > 10 && mod100 < 20) return 'корочек';
    if (mod10 === 1) return 'корочка';
    if (mod10 >= 2 && mod10 <= 4) return 'корочки';
    return 'корочек';
  }

  function pluralCrustsAcc(n) {
    return pluralCrusts(n) === 'корочка' ? 'корочку' : pluralCrusts(n);
  }

  function formatRate(n) {
    if (!isFinite(n)) return '∞';
    if (n >= 1000) return formatNumber(n);
    const rounded = Math.round(n * 10) / 10;
    return String(rounded).replace('.', ',');
  }

  function formatMultiplier(n) {
    if (!isFinite(n)) return '∞';
    if (n >= 100) return formatNumber(n);
    return String(Math.round(n * 100) / 100).replace('.', ',');
  }

  function recipeKey(ids) {
    return ids.slice().sort((a, b) => INGREDIENT_ORDER.indexOf(a) - INGREDIENT_ORDER.indexOf(b)).join('+');
  }

  function recipeName(key) {
    return RECIPE_NAMES[key] || 'Пицца';
  }

  function unlockedIngredients() {
    return INGREDIENT_ORDER.filter((id) => state.upgrades.includes(id));
  }

  function maxRecipeSize() {
    let size = 1;
    if (state.upgrades.includes('size2')) size += 1;
    if (state.upgrades.includes('size3')) size += 1;
    if (hasHeavenly('eternal')) size += 1;
    return size;
  }

  function binom(n, k) {
    if (k < 0 || k > n) return 0;
    let result = 1;
    for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
    return Math.round(result);
  }

  function maxRecipes() {
    const n = unlockedIngredients().length;
    const k = Math.min(n, maxRecipeSize());
    let total = 0;
    for (let i = 1; i <= k; i++) total += binom(n, i);
    return total;
  }

  function hasHeavenly(id) {
    return state.heavenly.includes(id);
  }

  function heavenlyCpsMultiplier() {
    let m = 1;
    if (hasHeavenly('spark')) m *= 1.05;
    if (hasHeavenly('oven')) m *= 1.1;
    if (hasHeavenly('secret')) m *= 1.25;
    if (hasHeavenly('infinity')) m *= 1.5;
    return m;
  }

  function crustMultiplier() {
    let m = 1;
    if (hasHeavenly('crusty')) m += 0.15;
    if (hasHeavenly('throne')) m += 0.5;
    return m;
  }

  function cookDiscount() {
    return hasHeavenly('shop') ? 0.85 : 1;
  }

  function pizzeriaDiscount() {
    return hasHeavenly('empire') ? 0.8 : 1;
  }

  function prestigeLevelFor(total) {
    return Math.floor(Math.cbrt(Math.max(0, total) / CRUST_DIVISOR) + 1e-9);
  }

  function prestigeLevel() {
    return prestigeLevelFor(state.totalSlices);
  }

  function prestigeMultiplier() {
    return 1 + prestigeLevel() * PRESTIGE_BONUS;
  }

  function crustGainBase() {
    return Math.max(0, prestigeLevel() - state.crustsEarned);
  }

  function crustGain() {
    return Math.floor(crustGainBase() * crustMultiplier());
  }

  function pluralBalls(n) {
    const mod100 = Math.floor(Math.abs(n)) % 100;
    const mod10 = mod100 % 10;
    if (mod100 > 10 && mod100 < 20) return 'шариков';
    if (mod10 === 1) return 'шарик';
    if (mod10 >= 2 && mod10 <= 4) return 'шарика';
    return 'шариков';
  }

  function formatDuration(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours > 0) return hours + 'ч ' + String(minutes).padStart(2, '0') + 'м';
    if (minutes > 0) return minutes + 'м ' + String(seconds).padStart(2, '0') + 'с';
    return seconds + 'с';
  }

  function mozzarellaProgress(now) {
    const t = typeof now === 'number' ? now : Date.now();
    if (!state.lumpStart) return 0;
    return clamp((t - state.lumpStart) / MOZZ_DURATION, 0, 1);
  }

  function mozzarellaRemaining(now) {
    const t = typeof now === 'number' ? now : Date.now();
    if (!state.lumpStart) return MOZZ_DURATION;
    return Math.max(0, MOZZ_DURATION - (t - state.lumpStart));
  }

  function accrueMozzarella(now, silent) {
    const t = typeof now === 'number' ? now : Date.now();
    if (!state.lumpStart || t < state.lumpStart - 1000) {
      state.lumpStart = t;
      return 0;
    }

    let granted = 0;
    let guard = 0;
    while (t - state.lumpStart >= MOZZ_DURATION && guard < 500) {
      state.lumpStart += MOZZ_DURATION;
      state.mozzarella += 1;
      granted += 1;
      guard += 1;
    }

    if (granted > 0) {
      saveGame();
      updateHud();
      renderMozzarella();
      if (!silent) {
        showToast('Моцарелла созрела: +' + granted + ' ' + pluralBalls(granted));
      }
    }

    return granted;
  }

  function grantSlices(amount) {
    const n = Math.floor(amount);
    if (!(n > 0)) return 0;
    state.slices += n;
    state.totalSlices += n;
    return n;
  }

  function addBuff(id, name, duration, cpsMult, clickBonus) {
    const now = Date.now();
    state.buffs = activeBuffs(now).filter((b) => b.id !== id);
    state.buffs.push({
      id,
      name,
      until: now + duration,
      cpsMult: cpsMult || 1,
      clickBonus: clickBonus || 0
    });
    saveGame();
    updateHud();
    renderMozzarella();
    showToast('Эффект: ' + name);
  }

  function pruneBuffs(now) {
    const t = typeof now === 'number' ? now : Date.now();
    const before = state.buffs.length;
    state.buffs = state.buffs.filter((b) => b && b.until > t);
    if (state.buffs.length !== before) {
      updateHud();
      renderMozzarella();
    }
  }

  function miniCooldownLeft(id, now) {
    const t = typeof now === 'number' ? now : Date.now();
    return Math.max(0, (state.miniCooldowns[id] || 0) - t);
  }

  function upgradeBuildingLevel(id, sourceEl) {
    const def = BUILDINGS[id];
    if (!def) return;
    const level = buildingLevel(id);
    if (level >= MAX_BUILDING_LEVEL) {
      showToast('Максимальный уровень');
      return;
    }

    const cost = levelCost(id);
    if (state.mozzarella < cost) {
      if (sourceEl) flashClass(sourceEl, 'shake', 360);
      showToast('Не хватает моцареллы');
      return;
    }

    state.mozzarella -= cost;
    state.levels[id] = level + 1;
    saveGame();
    updateHud();
    renderStore();
    renderMozzarella();
    showToast(def.name + ': уровень ' + (level + 1));
  }

  function buildingLevel(id) {
    return clamp(Math.floor(state.levels[id] || 0), 0, MAX_BUILDING_LEVEL);
  }

  function levelCost(id) {
    const level = buildingLevel(id);
    if (level >= MAX_BUILDING_LEVEL) return Infinity;
    return 1 + Math.floor(level / 3);
  }

  function levelBonus(id) {
    return 1 + 0.05 * buildingLevel(id);
  }

  function activeBuffs(now) {
    const t = typeof now === 'number' ? now : Date.now();
    return state.buffs.filter((b) => b && b.until > t);
  }

  function buffCpsMultiplier(now) {
    return activeBuffs(now).reduce((m, b) => m * (b.cpsMult || 1), 1);
  }

  function buffClickBonus(now) {
    return activeBuffs(now).reduce((s, b) => s + (b.clickBonus || 0), 0);
  }

  function clickPower() {
    let power = 1 + state.clicksOwned + buildingLevel('slice');
    if (hasHeavenly('hands')) power += 1;
    if (hasHeavenly('golden')) power += 2;
    power += buffClickBonus();
    return power;
  }

  function cooksMultiplier() {
    return Math.pow(2, state.recipes.length);
  }

  function pizzeriasMultiplier() {
    return Math.pow(1.5, state.pizzerias);
  }

  function productionMultiplier() {
    return cooksMultiplier()
      * levelBonus('cook')
      * pizzeriasMultiplier()
      * levelBonus('pizzeria')
      * levelBonus('chef')
      * prestigeMultiplier()
      * heavenlyCpsMultiplier()
      * buffCpsMultiplier();
  }

  function cps() {
    return state.cooks * productionMultiplier();
  }

  function costOf(base, owned) {
    return Math.ceil(base * Math.pow(COST_GROWTH, owned));
  }

  function costOfBuilding(id, owned) {
    const def = BUILDINGS[id];
    if (!def) return 0;
    let cost = costOf(def.baseCost, owned);
    if (id === 'cook') cost = Math.ceil(cost * cookDiscount());
    else if (id === 'pizzeria') cost = Math.ceil(cost * pizzeriaDiscount());
    return cost;
  }

  function bulkCostBuilding(id, owned, count) {
    let sum = 0;
    for (let i = 0; i < count; i++) sum += costOfBuilding(id, owned + i);
    return sum;
  }

  function bulkRefundBuilding(id, owned, count) {
    const n = Math.min(count, owned);
    let sum = 0;
    for (let i = 0; i < n; i++) sum += costOfBuilding(id, owned - 1 - i);
    return Math.floor(sum * SELL_RATE);
  }

  function ownedOf(id) {
    if (id === 'slice') return state.clicksOwned;
    if (id === 'cook') return state.cooks;
    if (id === 'pizzeria') return state.pizzerias;
    if (id === 'chef') return state.chefs;
    return 0;
  }

  function sellableOf(id) {
    if (id === 'chef') {
      return Math.max(0, state.chefs - state.recipes.length - state.chefCharges);
    }
    return ownedOf(id);
  }

  function randomRecipeKey() {
    if (!state.recipes.length) return 'plain';
    return state.recipes[Math.floor(Math.random() * state.recipes.length)];
  }

  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (err) {
      /* localStorage may be unavailable */
    }
  }

  function loadGame() {
    let data = null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (err) {
      data = null;
    }
    if (!data || typeof data !== 'object') return;

    const s = defaultState();
    const num = (value, fallback) => (typeof value === 'number' && isFinite(value) ? Math.max(0, value) : fallback);

    s.slices = num(data.slices, 0);
    s.totalSlices = num(data.totalSlices, 0);
    s.clicksOwned = Math.floor(num(data.clicksOwned, 0));
    s.cooks = Math.floor(num(data.cooks, 0));
    s.pizzerias = Math.floor(num(data.pizzerias, 0));
    s.chefs = Math.floor(num(data.chefs, 0));
    s.chefCharges = Math.floor(num(data.chefCharges, 0));
    s.crusts = Math.floor(num(data.crusts, num(data.pepperoni, 0)));
    s.crustsEarned = Math.floor(num(data.crustsEarned, 0));
    s.ascensions = Math.floor(num(data.ascensions, 0));
    s.mozzarella = Math.floor(num(data.mozzarella, 0));
    s.lumpStart = num(data.lumpStart, 0);

    const savedLevels = data.levels && typeof data.levels === 'object' ? data.levels : {};
    s.levels = {};
    for (const id of BUILDING_ORDER) {
      s.levels[id] = clamp(Math.floor(num(savedLevels[id], 0)), 0, MAX_BUILDING_LEVEL);
    }

    s.buffs = Array.isArray(data.buffs)
      ? data.buffs
        .filter((b) => b && typeof b.id === 'string' && typeof b.until === 'number' && b.until > Date.now())
        .slice(0, 8)
        .map((b) => ({
          id: b.id,
          name: typeof b.name === 'string' ? b.name : 'Эффект',
          until: b.until,
          cpsMult: num(b.cpsMult, 1),
          clickBonus: num(b.clickBonus, 0)
        }))
      : [];

    const savedCooldowns = data.miniCooldowns && typeof data.miniCooldowns === 'object' ? data.miniCooldowns : {};
    s.miniCooldowns = {};
    for (const id of BUILDING_ORDER) {
      s.miniCooldowns[id] = num(savedCooldowns[id], 0);
    }

    s.eventUpgrades = Array.isArray(data.eventUpgrades)
      ? [...new Set(data.eventUpgrades.filter((id) => id === 'valorant'))]
      : [];

    const savedEventCooldowns = data.eventCooldowns && typeof data.eventCooldowns === 'object' ? data.eventCooldowns : {};
    s.eventCooldowns = { cult: num(savedEventCooldowns.cult, 0) };

    const savedMarket = data.market && typeof data.market === 'object' ? data.market : {};
    s.market = defaultMarket();
    for (const id of INGREDIENT_ORDER) {
      const m = savedMarket[id] && typeof savedMarket[id] === 'object' ? savedMarket[id] : {};
      const base = MARKET_BASE[id];
      s.market[id].price = clamp(num(m.price, base), base * 0.4, base * 2.3);
      s.market[id].prev = clamp(num(m.prev, s.market[id].price), base * 0.4, base * 2.3);
      s.market[id].stock = Math.floor(clamp(num(m.stock, 0), 0, 9999));
      s.market[id].lock = ['buy', 'sell'].includes(m.lock) ? m.lock : '';

      const history = Array.isArray(m.history)
        ? m.history
          .filter((value) => typeof value === 'number' && isFinite(value))
          .map((value) => clamp(value, base * 0.4, base * 2.3))
          .slice(-MARKET_HISTORY)
        : [];
      s.market[id].history = history.length >= 2
        ? history
        : Array.from({ length: 12 }, () => s.market[id].price);
    }

    s.marketUpdatedAt = typeof data.marketUpdatedAt === 'number'
      && isFinite(data.marketUpdatedAt)
      && data.marketUpdatedAt > 0
      ? data.marketUpdatedAt
      : Date.now();

    const validHeavenly = Object.keys(HEAVENLY);
    s.heavenly = Array.isArray(data.heavenly)
      ? [...new Set(data.heavenly.filter((id) => validHeavenly.includes(id)))]
      : [];

    const validUpgrades = ['tomato', 'cheese', 'pepperoni', 'size2', 'size3'];
    s.upgrades = Array.isArray(data.upgrades)
      ? data.upgrades.filter((id) => validUpgrades.includes(id))
      : [];

    s.recipes = Array.isArray(data.recipes)
      ? [...new Set(data.recipes.filter((key) => RECIPE_NAMES[key]))]
      : [];

    s.chefs = Math.max(s.chefs, s.recipes.length + s.chefCharges);
    s.chefCharges = clamp(s.chefCharges, 0, Math.max(0, s.chefs - s.recipes.length));
    s.totalSlices = Math.max(s.totalSlices, s.slices);
    s.recipes = s.recipes.slice(0, Math.max(0, maxRecipesFor(s)));

    s.skin = typeof data.skin === 'string' && PIZZA_SKINS[data.skin] ? data.skin : 'classic';

    state = s;
  }

  function maxRecipesFor(s) {
    const n = INGREDIENT_ORDER.filter((id) => s.upgrades.includes(id)).length;
    let size = 1;
    if (s.upgrades.includes('size2')) size += 1;
    if (s.upgrades.includes('size3')) size += 1;
    if (s.heavenly.includes('eternal')) size += 1;
    const k = Math.min(n, size);
    let total = 0;
    for (let i = 1; i <= k; i++) total += binom(n, i);
    return total;
  }

  function flashClass(el, cls, duration) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), duration);
  }

  let toastTimer = 0;

  function showToast(text) {
    if (!els.toast) return;
    els.toast.textContent = text;
    els.toast.hidden = false;
    els.toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove('show');
      window.setTimeout(() => { els.toast.hidden = true; }, 250);
    }, 2800);
  }

  /* ---------- Pizza sprites ---------- */

  function paintPizzaBlob(g, cx, cy, r, colors, seed) {
    const x0 = Math.max(0, Math.floor(cx - r - 2));
    const x1 = Math.min(63, Math.ceil(cx + r + 2));
    const y0 = Math.max(0, Math.floor(cy - r - 2));
    const y1 = Math.min(63, Math.ceil(cy + r + 2));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        if (Math.hypot(px - 32, py - 32) > 27.2) continue;

        const dx = px - cx;
        const dy = py - cy;
        const d = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        const wobble = Math.sin(ang * 3 + seed) * 0.55 + Math.sin(ang * 5 + seed * 2.3) * 0.3;
        if (d > r + wobble) continue;

        let col = colors.main;
        if (d > r - 1.1) col = colors.edge;
        else if (dx + dy < -r * 0.45) col = colors.light;

        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  }

  function drawPizzaTomato(g) {
    const blobs = [
      [-12, -6, 4.6, 1.2],
      [6, -12, 4.0, 2.4],
      [12, 4, 4.2, 3.6],
      [0, 10, 4.8, 4.8],
      [-6, 1, 3.4, 6.1],
      [14, -4, 2.8, 7.4]
    ];
    const colors = { edge: '#7e1f16', main: '#b83424', light: '#d9533c' };
    for (const [x, y, r, seed] of blobs) {
      paintPizzaBlob(g, 32 + x, 32 + y, r, colors, seed);
    }
  }

  function drawPizzaCheese(g) {
    const blobs = [
      [-10, -10, 4.8, 0.7],
      [8, -6, 4.0, 1.9],
      [14, 8, 3.6, 3.1],
      [-4, 12, 4.2, 4.3],
      [-16, 4, 3.2, 5.5],
      [2, 2, 3.6, 6.7],
      [17, -10, 2.6, 7.9]
    ];
    const colors = { edge: '#d9b44a', main: '#fff0b8', light: '#fffbe0' };
    for (const [x, y, r, seed] of blobs) {
      paintPizzaBlob(g, 32 + x, 32 + y, r, colors, seed);
    }
  }

  function drawPizzaPepperoni(g) {
    const pepperoni = [
      { x: -9, y: -7, r: 4.2 },
      { x: 8, y: -9, r: 4.0 },
      { x: 10, y: 8, r: 4.3 },
      { x: -7, y: 10, r: 3.8 },
      { x: -15, y: 1, r: 3.0 },
      { x: 2, y: -2, r: 3.4 },
      { x: 1, y: 14, r: 3.0 },
      { x: 15, y: 0, r: 3.0 }
    ];

    for (const p of pepperoni) {
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const dx = x + 0.5 - (32 + p.x);
          const dy = y + 0.5 - (32 + p.y);
          const dd = Math.hypot(dx, dy);
          if (dd > p.r) continue;
          if (Math.hypot(x + 0.5 - 32, y + 0.5 - 32) > 27.2) continue;

          let col = '#b83424';
          if (dd > p.r - 0.95) col = '#6e1a11';
          else if (dx + dy < -p.r * 0.3) col = '#d9533c';
          else if (dx + dy > p.r * 0.4) col = '#9e2a1c';
          g.fillStyle = col;
          g.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  function drawPizzaBasil(g) {
    const basil = [
      [-4, -13], [13, 10], [-12, 11], [6, 2], [-5, -4], [11, -2]
    ];
    for (const [bx, by] of basil) {
      g.fillStyle = '#4d8b2a';
      g.fillRect(32 + bx, 32 + by, 2, 2);
      g.fillStyle = '#7fbe45';
      g.fillRect(32 + bx, 32 + by, 1, 1);
    }
  }

  /* ---------- Skin decorations ---------- */

  function skinOnPizza(x, y) {
    return Math.hypot(x + 0.5 - 32, y + 0.5 - 32) <= 27.2;
  }

  function skinCircle(g, cx, cy, r, colors) {
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        if (!skinOnPizza(x, y)) continue;
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        const col = d > r - 1
          ? colors.edge
          : dx + dy < -r * 0.35 ? colors.light : colors.main;
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  }

  function drawSkinStar(g, cx, cy, color) {
    g.fillStyle = color;
    g.fillRect(cx, cy - 2, 1, 5);
    g.fillRect(cx - 2, cy, 5, 1);
    g.fillRect(cx - 1, cy - 1, 3, 3);
  }

  function drawSkinZ(g, x, y, color) {
    const rows = ['1111', '0001', '0010', '0100', '1111'];
    g.fillStyle = color;
    for (let ry = 0; ry < rows.length; ry++) {
      for (let rx = 0; rx < 4; rx++) {
        if (rows[ry][rx] === '1') g.fillRect(x + rx, y + ry, 1, 1);
      }
    }
  }

  function drawSkinSons4(g) {
    const cheeses = [
      { x: -10, y: -9, r: 8.2, colors: { edge: '#cbb27a', main: '#fffbe8', light: '#ffffff' }, hole: '#c9b98f' },
      { x: 10, y: -10, r: 7.6, colors: { edge: '#b46f12', main: '#ffb52e', light: '#ffd36b' }, hole: '#9a5c0e' },
      { x: -9, y: 10, r: 7.4, colors: { edge: '#8d9bb5', main: '#dfe9f5', light: '#ffffff' }, hole: '#6f86ad' },
      { x: 10, y: 9, r: 8.0, colors: { edge: '#6b3a1f', main: '#c98a52', light: '#e3b078' }, hole: '#4f2a15' }
    ];
    for (let i = 0; i < cheeses.length; i++) {
      const c = cheeses[i];
      paintPizzaBlob(g, 32 + c.x, 32 + c.y, c.r, c.colors, i * 1.7 + 0.4);
      g.fillStyle = c.hole;
      g.fillRect(32 + c.x - 2, 32 + c.y - 1, 1, 1);
      g.fillRect(32 + c.x + 1, 32 + c.y + 2, 1, 1);
      g.fillRect(32 + c.x + 3, 32 + c.y - 2, 1, 1);
    }
  }

  function drawSkinPigs22(g) {
    for (let i = 0; i < 22; i++) {
      const a = i * 2.399963 + 0.55;
      const rr = Math.sqrt((i + 0.7) / 22) * 23.5;
      const x = 32 + Math.cos(a) * rr;
      const y = 32 + Math.sin(a) * rr;
      const r = 1.9 + (i % 4) * 0.12;
      skinCircle(g, x, y, r, { edge: '#d97a92', main: '#ffb3c1', light: '#ffd6de' });
      g.fillStyle = '#7d3a4c';
      g.fillRect(Math.round(x) - 1, Math.round(y), 1, 1);
      g.fillRect(Math.round(x) + 1, Math.round(y), 1, 1);
    }
  }

  function drawSkinPigPig(g) {
    skinCircle(g, 20, 18.5, 5.4, { edge: '#c46a80', main: '#e2879c', light: '#efa9b8' });
    skinCircle(g, 44, 18.5, 5.4, { edge: '#c46a80', main: '#e2879c', light: '#efa9b8' });
    skinCircle(g, 32, 33, 15, { edge: '#e2879c', main: '#ffb8c6', light: '#ffd3da' });
    skinCircle(g, 23, 40, 2.2, { edge: '#f2a0b2', main: '#f7a9ba', light: '#ffc4d0' });
    skinCircle(g, 41, 40, 2.2, { edge: '#f2a0b2', main: '#f7a9ba', light: '#ffc4d0' });
    skinCircle(g, 32, 37, 6.4, { edge: '#d97a92', main: '#ff9fb0', light: '#ffc2cd' });

    g.fillStyle = '#4a2030';
    g.fillRect(26, 29, 2, 3);
    g.fillRect(36, 29, 2, 3);
    g.fillStyle = '#ffffff';
    g.fillRect(26, 29, 1, 1);
    g.fillRect(36, 29, 1, 1);
    g.fillStyle = '#7d3a4c';
    g.fillRect(29, 36, 2, 3);
    g.fillRect(34, 36, 2, 3);
  }

  function drawSkinVatsai(g) {
    g.fillStyle = '#f4e3bd';
    g.fillRect(23, 30, 5, 1);
    g.fillRect(22, 29, 1, 1);
    g.fillRect(28, 29, 1, 1);
    g.fillRect(36, 30, 5, 1);
    g.fillRect(35, 29, 1, 1);
    g.fillRect(41, 29, 1, 1);
    g.fillRect(31, 38, 3, 1);

    const stars = [[-17, -7], [12, 12], [-3, -19], [18, -2], [-14, 14]];
    for (const [sx, sy] of stars) drawSkinStar(g, 32 + sx, 32 + sy, '#ffe9a8');

    drawSkinZ(g, 41, 15, '#cdb38a');
    drawSkinZ(g, 45, 10, '#f4e3bd');
  }

  function drawSkinKids(g) {
    const colors = ['#ff5d73', '#4ea8ff', '#7ed957', '#ffd34e', '#c77dff', '#ff9f43'];
    for (let i = 0; i < 34; i++) {
      const a = i * 2.399963 + 0.3;
      const rr = 7 + ((i * 11) % 18);
      const x = Math.round(32 + Math.cos(a) * rr);
      const y = Math.round(32 + Math.sin(a) * rr);
      if (Math.hypot(x - 32, y - 32) > 25) continue;
      g.fillStyle = colors[i % colors.length];
      g.fillRect(x, y, 2, 1);
      g.fillRect(x + 1, y + 1, 1, 1);
    }

    drawSkinStar(g, 22, 23, '#ffffff');
    drawSkinStar(g, 43, 38, '#ffd34e');
    drawSkinStar(g, 39, 21, '#4ea8ff');

    g.fillStyle = '#7a3a1c';
    g.fillRect(27, 28, 2, 3);
    g.fillRect(36, 28, 2, 3);
    g.fillRect(28, 36, 1, 1);
    g.fillRect(29, 37, 1, 1);
    g.fillRect(30, 38, 5, 1);
    g.fillRect(35, 37, 1, 1);
    g.fillRect(36, 36, 1, 1);
  }

  function drawSkinBurger(g) {
    // Top bun
    for (let y = 6; y <= 30; y++) {
      const t = (y - 30) / 24;
      const half = 26 * Math.pow(Math.max(0, 1 - t * t), 0.42);
      const x0 = Math.round(32 - half);
      const x1 = Math.round(32 + half);
      for (let x = x0; x <= x1; x++) {
        let col = '#e8a24a';
        if (y <= 10) col = '#f6c46c';
        else if (y >= 29) col = '#b86a24';
        else if (x <= x0 + 1 || x >= x1 - 1) col = '#c9792b';
        else if (x < 32 && y < 23) col = '#f9d184';
        else if (x > 32 && y > 24) col = '#db9240';
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }

    // Sesame seeds
    const seeds = [
      [17, 15], [25, 11], [34, 10], [43, 14], [51, 20],
      [21, 21], [31, 18], [40, 21], [47, 25], [15, 23],
      [37, 15], [27, 25], [45, 29], [23, 28]
    ];
    g.fillStyle = '#d9a95c';
    for (const [x, y] of seeds) g.fillRect(x, y + 1, 2, 1);
    g.fillStyle = '#fff3cf';
    for (const [x, y] of seeds) g.fillRect(x, y, 2, 1);

    // Lettuce
    for (let x = 4; x <= 60; x++) {
      const wave = Math.round(Math.sin(x * 0.85) * 1.3);
      const bottom = 34 + wave;
      for (let y = 29; y <= bottom; y++) {
        let col = '#76b83f';
        if (y === 29) col = '#a6d96a';
        else if (y >= bottom - 1) col = '#4f8a26';
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
      if (x % 4 === 1) {
        g.fillStyle = '#7fc84a';
        g.fillRect(x, bottom + 1, 1, 1);
      }
    }

    // Patty
    for (let y = 37; y <= 47; y++) {
      const t = (y - 42) / 5.5;
      const inset = Math.round(2.4 * t * t);
      for (let x = 7 + inset; x <= 57 - inset; x++) {
        let col = '#6b3a1f';
        if (y === 37) col = '#7d4626';
        else if (y === 47) col = '#4a2412';
        else if ((x * 7 + y * 13) % 29 === 0) col = '#4a2412';
        else if ((x * 11 + y * 5) % 37 === 0) col = '#8a4f2a';
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }

    // Cheese
    for (let x = 6; x <= 58; x++) {
      for (let y = 34; y <= 37; y++) {
        let col = '#ffcf3f';
        if (y === 34) col = '#ffe27a';
        else if (y === 37) col = '#e8a51e';
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }

    const drips = [[10, 3], [18, 4], [28, 3], [37, 5], [47, 3], [55, 2]];
    for (const [dx, len] of drips) {
      for (let k = 0; k < len; k++) {
        g.fillStyle = k === len - 1 ? '#e8a51e' : '#ffcf3f';
        g.fillRect(dx, 38 + k, 1, 1);
        g.fillRect(dx + 1, 38 + k, 1, 1);
      }
    }

    // Bottom bun
    for (let y = 46; y <= 58; y++) {
      const t = (y - 46) / 13;
      const half = 25 * Math.pow(Math.max(0, 1 - t * t), 0.5);
      const x0 = Math.round(32 - half);
      const x1 = Math.round(32 + half);
      for (let x = x0; x <= x1; x++) {
        let col = '#e8a24a';
        if (y === 46) col = '#f3ba63';
        else if (y >= 56) col = '#b86a24';
        else if (x <= x0 + 1 || x >= x1 - 1) col = '#c9792b';
        else if (x < 32 && y < 50) col = '#f0b45a';
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  }

  const SKIN_DECOR = {
    sons4: drawSkinSons4,
    pigs22: drawSkinPigs22,
    pigpig: drawSkinPigPig,
    vatsai: drawSkinVatsai,
    kids: drawSkinKids
  };

  function createPizzaSprite(recipe, skinId) {
    const skin = PIZZA_SKINS[skinId] || PIZZA_SKINS.classic;
    const size = 64;
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');

    if (skin.custom === 'burger') {
      drawSkinBurger(g);
      return c;
    }

    const p = skin.palette;
    const cx = 32;
    const cy = 32;
    const R = 30.6;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        if (d > R) continue;

        let col;
        const light = (dx + dy) / Math.max(d, 0.001);
        const h = (x * 31 + y * 17 + x * y * 3) % 97;

        if (d > R - 1.25) {
          col = p.crustEdge;
        } else if (d > R - 3.5) {
          col = light < -0.35 ? p.crustLight : light > 0.45 ? p.crustDark : p.crustMid;
          if (h === 0) col = p.crustSpeck;
          if (h === 1 && light < -0.1) col = p.crustSpeckLight;
        } else if (d > R - 5.2) {
          col = light < -0.4 ? p.sauceLight : p.sauceDark;
        } else {
          col = light < -0.5 ? p.cheeseLight : light > 0.5 ? p.cheeseDark : p.cheeseMid;
          if (h === 0) col = p.cheeseSpeck;
          if (h === 5) col = p.cheeseSpeck2;
          if (d > 23.6) col = p.cheeseOuter;
        }

        if (d < 24.8 && d > 1.2) {
          const ang = Math.atan2(dy, dx);
          const seg = (Math.PI * 2) / 8;
          const nearest = Math.round(ang / seg) * seg;
          if (Math.abs(ang - nearest) < 0.038) col = p.sliceLine;
        }

        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }

    const ings = recipe === 'plain' ? [] : recipe.split('+');
    if (ings.includes('tomato')) drawPizzaTomato(g);
    if (ings.includes('cheese')) drawPizzaCheese(g);
    if (ings.includes('pepperoni')) drawPizzaPepperoni(g);
    drawPizzaBasil(g);

    const decor = SKIN_DECOR[skin.decor];
    if (decor) decor(g);

    return c;
  }

  function getPizzaSprite(key, skinId) {
    const skin = PIZZA_SKINS[skinId] ? skinId : (state.skin && PIZZA_SKINS[state.skin] ? state.skin : 'classic');
    const cacheKey = key + '|' + skin;
    if (!pizzaSpriteCache.has(cacheKey)) {
      pizzaSpriteCache.set(cacheKey, createPizzaSprite(key, skin));
    }
    return pizzaSpriteCache.get(cacheKey);
  }

  function paintSliceBlob(g, cx, cy, r, colors, inner) {
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        if (!pointInTriangle(px, py, ...inner)) continue;
        const dx = px - cx;
        const dy = py - cy;
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        let col = colors.main;
        if (d > r - 0.8) col = colors.edge;
        else if (dx + dy < -r * 0.4) col = colors.light;
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  }

  function createSliceSprite(recipe) {
    const size = 20;
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    const outer = [10, 20.5, -1.5, 1, 21.5, 1];
    const inner = [10, 18, 1, 3, 19, 3];
    const ings = recipe === 'plain' ? [] : recipe.split('+');

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        if (!pointInTriangle(px, py, ...outer)) continue;

        let col = '#4a1d0e';
        if (pointInTriangle(px, py, ...inner)) {
          if (py < 6.4) {
            col = px < 10 ? '#f0b45a' : '#c97628';
            if (py > 5.4) col = '#a85a1f';
            if ((x * 5 + y * 3) % 23 === 0) col = '#8a4218';
          } else {
            col = px + py < 20 ? '#ffdf72' : '#e8ae2c';
            if ((x * 11 + y * 7) % 31 === 0) col = '#f6c845';
          }
        }
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }

    if (ings.includes('tomato')) {
      paintSliceBlob(g, 7.5, 9.5, 2.4, { edge: '#7e1f16', main: '#b83424', light: '#d9533c' }, inner);
      paintSliceBlob(g, 13, 12.5, 2.0, { edge: '#7e1f16', main: '#b83424', light: '#d9533c' }, inner);
    }
    if (ings.includes('cheese')) {
      paintSliceBlob(g, 7, 8, 2.0, { edge: '#d9b44a', main: '#fff0b8', light: '#fffbe0' }, inner);
      paintSliceBlob(g, 12, 13.5, 2.1, { edge: '#d9b44a', main: '#fff0b8', light: '#fffbe0' }, inner);
    }
    if (ings.includes('pepperoni')) {
      const pepperoni = [
        { x: 7.2, y: 9.2, r: 2.3 },
        { x: 13, y: 13.2, r: 1.8 }
      ];
      for (const p of pepperoni) {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const dx = x + 0.5 - p.x;
            const dy = y + 0.5 - p.y;
            const dd = Math.hypot(dx, dy);
            if (dd > p.r) continue;
            if (!pointInTriangle(x + 0.5, y + 0.5, ...inner)) continue;
            g.fillStyle = dd > p.r - 0.8 ? '#6e1a11' : (dx + dy < 0 ? '#d9533c' : '#b83424');
            g.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    g.fillStyle = '#5a9a32';
    g.fillRect(10, 7, 1, 2);
    g.fillRect(11, 7, 1, 1);

    return c;
  }

  function rotateSprite(base, quarters) {
    if (!quarters) return base;
    const size = base.width;
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.translate(size / 2, size / 2);
    g.rotate((Math.PI / 2) * quarters);
    g.drawImage(base, -size / 2, -size / 2);
    return c;
  }

  function getSliceSprites(key) {
    if (!sliceSpriteCache.has(key)) {
      const base = createSliceSprite(key);
      sliceSpriteCache.set(key, [0, 1, 2, 3].map((quarter) => rotateSprite(base, quarter)));
    }
    return sliceSpriteCache.get(key);
  }

  /* ---------- Ingredient / building icons ---------- */

  function createIngredientIcon(id) {
    const c = makeCanvas(20, 20);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    if (id === 'tomato') {
      g.fillStyle = '#4a1d0e';
      g.fillRect(6, 4, 9, 14);
      g.fillStyle = '#c93b2b';
      g.fillRect(7, 6, 7, 11);
      g.fillStyle = '#e05a3a';
      g.fillRect(8, 7, 2, 8);
      g.fillStyle = '#7e1f16';
      g.fillRect(7, 16, 7, 1);
      g.fillStyle = '#f4e3bd';
      g.fillRect(7, 2, 7, 3);
      g.fillStyle = '#cdb38a';
      g.fillRect(7, 4, 7, 1);
      g.fillStyle = '#4d8b2a';
      g.fillRect(12, 1, 2, 2);
      g.fillRect(14, 0, 2, 1);
    } else if (id === 'cheese') {
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          const dx = x + 0.5 - 10;
          const dy = y + 0.5 - 10;
          const d = Math.hypot(dx, dy);
          if (d > 8.2) continue;
          let col = '#e8c04b';
          if (d > 7.1) col = '#b08d2c';
          else if (dx + dy < -3) col = '#ffe9a8';
          g.fillStyle = col;
          g.fillRect(x, y, 1, 1);
        }
      }
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          if (Math.hypot(x + 0.5 - 12.5, y + 0.5 - 8.5) < 2.2) {
            g.fillStyle = '#2a1408';
            g.fillRect(x, y, 1, 1);
          }
        }
      }
    } else {
      for (let i = 0; i < 12; i++) {
        g.fillStyle = '#4a1d0e';
        g.fillRect(3 + i, 15 - i, 5, 5);
      }
      for (let i = 0; i < 11; i++) {
        g.fillStyle = '#a83226';
        g.fillRect(4 + i, 16 - i, 3, 3);
      }
      g.fillStyle = '#d9533c';
      g.fillRect(6, 14, 2, 2);
      g.fillRect(10, 10, 2, 2);
      g.fillRect(14, 6, 2, 2);
      g.fillStyle = '#7e1f16';
      g.fillRect(8, 13, 1, 1);
      g.fillRect(12, 9, 1, 1);
    }

    return c;
  }

  function getIngredientIcon(id) {
    const key = 'ing-' + id;
    if (!iconCache.has(key)) iconCache.set(key, createIngredientIcon(id));
    return iconCache.get(key);
  }

  function drawCookIcon(g) {
    g.fillStyle = '#f4e3bd';
    g.fillRect(7, 3, 10, 2);
    g.fillRect(5, 5, 14, 2);
    g.fillRect(4, 7, 16, 2);
    g.fillStyle = '#cdb38a';
    g.fillRect(4, 9, 16, 1);
    g.fillStyle = '#e8b07a';
    g.fillRect(7, 10, 10, 7);
    g.fillStyle = '#2a1408';
    g.fillRect(8, 12, 2, 2);
    g.fillRect(14, 12, 2, 2);
    g.fillStyle = '#6b3b1e';
    g.fillRect(10, 15, 4, 1);
    g.fillStyle = '#8cc84b';
    g.fillRect(5, 17, 14, 3);
    g.fillStyle = '#5a9a32';
    g.fillRect(5, 19, 14, 1);
  }

  function drawChefIcon(g) {
    g.fillStyle = '#ffd34e';
    g.fillRect(7, 2, 10, 2);
    g.fillRect(5, 4, 14, 2);
    g.fillRect(4, 6, 16, 2);
    g.fillStyle = '#b87a18';
    g.fillRect(4, 8, 16, 2);
    g.fillStyle = '#e8b07a';
    g.fillRect(7, 10, 10, 7);
    g.fillStyle = '#2a1408';
    g.fillRect(8, 12, 2, 2);
    g.fillRect(14, 12, 2, 2);
    g.fillStyle = '#6b3b1e';
    g.fillRect(10, 15, 4, 1);
    g.fillStyle = '#d9533c';
    g.fillRect(9, 5, 2, 2);
    g.fillRect(11, 3, 2, 2);
    g.fillRect(13, 5, 2, 2);
    g.fillRect(11, 7, 2, 1);
    g.fillStyle = '#8cc84b';
    g.fillRect(5, 17, 14, 3);
  }

  function drawPizzeriaIcon(g) {
    g.fillStyle = '#2a1408';
    g.fillRect(3, 7, 18, 15);
    g.fillStyle = '#e8dcc2';
    g.fillRect(4, 8, 16, 13);

    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 === 0 ? '#d9533c' : '#f4e3bd';
      g.fillRect(3 + i * 2, 5, 2, 4);
    }

    g.fillStyle = '#6b3b1e';
    g.fillRect(6, 13, 6, 8);
    g.fillStyle = '#ffd34e';
    g.fillRect(14, 12, 5, 4);
    g.fillStyle = '#b87a18';
    g.fillRect(14, 16, 5, 1);
    g.fillStyle = '#8cc84b';
    g.fillRect(15, 13, 1, 1);
    g.fillRect(17, 14, 1, 1);
    g.fillStyle = '#2a1408';
    g.fillRect(15, 11, 3, 1);
  }

  function createCrustIcon() {
    const key = 'crust-icon';
    if (iconCache.has(key)) return iconCache.get(key);

    const c = makeCanvas(20, 20);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const dx = x + 0.5 - 10;
        const dy = y + 0.5 - 10;
        const d = Math.hypot(dx, dy);
        if (d > 9.3) continue;

        let col;
        if (d > 8.1) col = '#8a5a34';
        else if (d > 6.4) col = '#e8b07a';
        else if (d > 5.2) col = '#b87a18';
        else continue;

        if (dx + dy > 3) {
          col = d > 8.1 ? '#6b3b1e' : d > 6.4 ? '#cdb38a' : '#8a5a34';
        }
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }

    g.fillStyle = '#fffaf0';
    g.fillRect(6, 6, 1, 1);
    g.fillRect(12, 4, 1, 1);
    g.fillRect(14, 12, 1, 1);
    g.fillStyle = '#a86b3c';
    g.fillRect(8, 14, 1, 1);
    g.fillRect(4, 10, 1, 1);

    iconCache.set(key, c);
    return c;
  }

  function drawCrustIcon() {
    if (!els.crustIcon) return;
    const g = els.crustIcon.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 20, 20);
    g.drawImage(createCrustIcon(), 0, 0, 20, 20);
  }

  function createMozzarellaIcon() {
    const key = 'mozzarella-icon';
    if (iconCache.has(key)) return iconCache.get(key);

    const c = makeCanvas(24, 24);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const cx = 12;
    const cy = 12;
    const radius = 8.6;

    for (let y = 0; y < 24; y++) {
      for (let x = 0; x < 24; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        const wobble = Math.sin(ang * 3 + 1.3) * 0.35 + Math.sin(ang * 5 + 2.1) * 0.2;
        if (d > radius + wobble) continue;

        const light = -(dx + dy) / (radius * 1.7);
        let col;
        if (d > radius - 1) col = '#c9ab7d';
        else if (light > 0.5) col = '#fffdf4';
        else if (light > 0.08) col = '#fff6e2';
        else if (light > -0.45) col = '#f1e1bd';
        else col = '#e2cfa8';

        const noise = (x * 37 + y * 61 + x * y * 7) % 31;
        if (noise === 0) col = d > radius - 1 ? '#b89a6a' : '#e8d6b0';
        else if (noise === 1 && light > 0) col = '#fffaf0';

        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }

    const holes = [
      [8, 9], [14, 8], [10, 14], [16, 13], [6, 13], [13, 17], [17, 10]
    ];
    for (const [hx, hy] of holes) {
      g.fillStyle = '#d9c49a';
      g.fillRect(hx, hy, 2, 2);
      g.fillStyle = '#b89a6a';
      g.fillRect(hx, hy + 1, 1, 1);
      g.fillRect(hx + 1, hy, 1, 1);
      g.fillStyle = '#fffdf4';
      g.fillRect(hx - 1, hy - 1, 1, 1);
    }

    g.fillStyle = '#fffdf4';
    g.fillRect(9, 6, 1, 2);
    g.fillRect(8, 7, 1, 1);
    g.fillRect(10, 5, 1, 1);

    g.fillStyle = '#b89a6a';
    g.fillRect(12, 20, 3, 1);
    g.fillRect(8, 19, 1, 1);

    iconCache.set(key, c);
    return c;
  }

  function drawMozzarellaIcon() {
    if (!els.mozzIcon) return;
    const g = els.mozzIcon.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 20, 20);
    g.drawImage(createMozzarellaIcon(), 0, 0, 20, 20);
  }

  function createCultistIcon() {
    const key = 'cultist-icon';
    if (iconCache.has(key)) return iconCache.get(key);

    const c = makeCanvas(48, 48);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    // robe
    g.fillStyle = '#2a1430';
    g.fillRect(13, 24, 22, 20);
    g.fillRect(10, 36, 28, 10);
    g.fillStyle = '#3d1d44';
    g.fillRect(15, 26, 18, 14);
    g.fillStyle = '#1a0c20';
    g.fillRect(10, 44, 28, 3);
    g.fillRect(13, 42, 22, 2);

    // hood
    g.fillStyle = '#3d1d44';
    g.fillRect(14, 8, 20, 6);
    g.fillRect(12, 12, 24, 14);
    g.fillStyle = '#2a1430';
    g.fillRect(12, 24, 24, 3);
    g.fillStyle = '#4e2757';
    g.fillRect(15, 9, 8, 2);
    g.fillRect(13, 13, 4, 6);

    // face shadow
    g.fillStyle = '#0d060d';
    g.fillRect(17, 14, 14, 11);
    g.fillStyle = '#1c0b1c';
    g.fillRect(18, 15, 12, 4);

    // eyes
    g.fillStyle = '#ffd34e';
    g.fillRect(20, 18, 2, 2);
    g.fillRect(27, 18, 2, 2);
    g.fillStyle = '#fff2a8';
    g.fillRect(20, 18, 1, 1);
    g.fillRect(27, 18, 1, 1);

    // huge mustache
    g.fillStyle = '#8a5a34';
    g.fillRect(16, 23, 17, 3);
    g.fillRect(14, 21, 3, 2);
    g.fillRect(31, 21, 3, 2);
    g.fillStyle = '#b87a3c';
    g.fillRect(17, 23, 6, 1);
    g.fillRect(26, 23, 6, 1);
    g.fillStyle = '#6b3b1e';
    g.fillRect(18, 25, 12, 1);
    g.fillRect(14, 22, 1, 1);
    g.fillRect(33, 22, 1, 1);

    // goatee + robe details
    g.fillStyle = '#6b3b1e';
    g.fillRect(23, 27, 3, 3);
    g.fillStyle = '#b87a18';
    g.fillRect(22, 35, 5, 2);
    g.fillStyle = '#ffd34e';
    g.fillRect(24, 34, 1, 1);
    g.fillStyle = '#1a0c20';
    g.fillRect(16, 38, 3, 5);
    g.fillRect(30, 38, 3, 5);

    iconCache.set(key, c);
    return c;
  }

  function createValorantIcon() {
    const key = 'valorant-icon';
    if (iconCache.has(key)) return iconCache.get(key);

    const c = makeCanvas(24, 24);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    g.fillStyle = '#0b0f14';
    g.fillRect(2, 2, 20, 20);
    g.fillStyle = '#12252a';
    g.fillRect(3, 3, 18, 18);

    // price chart
    g.fillStyle = '#3a6b5c';
    g.fillRect(5, 15, 2, 4);
    g.fillRect(11, 11, 2, 5);
    g.fillRect(17, 7, 2, 6);
    g.fillStyle = '#4ee0c8';
    g.fillRect(5, 14, 2, 2);
    g.fillRect(11, 10, 2, 2);
    g.fillRect(17, 6, 2, 2);

    // V emblem
    g.fillStyle = '#ff4655';
    g.fillRect(6, 5, 2, 3);
    g.fillRect(7, 8, 2, 3);
    g.fillRect(9, 11, 2, 3);
    g.fillRect(11, 8, 2, 3);
    g.fillRect(13, 5, 2, 3);
    g.fillStyle = '#ffd34e';
    g.fillRect(10, 14, 2, 1);

    iconCache.set(key, c);
    return c;
  }

  function drawFlameIcon(g) {
    g.fillStyle = '#c93b2b';
    g.fillRect(10, 2, 4, 3);
    g.fillRect(8, 5, 8, 4);
    g.fillRect(7, 9, 10, 5);
    g.fillRect(6, 14, 12, 7);
    g.fillRect(8, 21, 8, 1);

    g.fillStyle = '#ff8a2b';
    g.fillRect(11, 6, 2, 3);
    g.fillRect(10, 9, 4, 4);
    g.fillRect(9, 13, 6, 6);
    g.fillRect(10, 19, 4, 2);

    g.fillStyle = '#ffd34e';
    g.fillRect(11, 10, 2, 5);
    g.fillRect(10, 15, 4, 4);
  }

  function drawDoughIcon(g) {
    for (let y = 0; y < 24; y++) {
      for (let x = 0; x < 24; x++) {
        const dx = x + 0.5 - 12;
        const dy = y + 0.5 - 12;
        const d = Math.hypot(dx, dy);
        if (d > 8) continue;
        let col = '#f4e3bd';
        if (d > 7) col = '#cdb38a';
        else if (dx + dy < -3) col = '#fffaf0';
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }

    g.fillStyle = '#fffaf0';
    g.fillRect(9, 8, 1, 1);
    g.fillRect(14, 11, 1, 1);
    g.fillStyle = '#b08d62';
    g.fillRect(11, 15, 1, 1);
    g.fillRect(7, 12, 1, 1);
  }

  function drawHandIcon(g) {
    g.fillStyle = '#2a1408';
    g.fillRect(6, 4, 3, 8);
    g.fillRect(10, 2, 3, 10);
    g.fillRect(14, 4, 3, 8);
    g.fillRect(6, 10, 11, 9);
    g.fillRect(17, 11, 4, 5);

    g.fillStyle = '#e8b07a';
    g.fillRect(7, 5, 1, 7);
    g.fillRect(11, 3, 1, 9);
    g.fillRect(15, 5, 1, 7);
    g.fillRect(7, 11, 9, 7);
    g.fillRect(18, 12, 2, 3);

    g.fillStyle = '#8cc84b';
    g.fillRect(6, 18, 12, 3);
    g.fillStyle = '#5a9a32';
    g.fillRect(6, 20, 12, 1);
  }

  function drawBookIcon(g) {
    g.fillStyle = '#2a1408';
    g.fillRect(3, 3, 18, 19);
    g.fillStyle = '#6b3b1e';
    g.fillRect(4, 4, 16, 17);
    g.fillStyle = '#4a2612';
    g.fillRect(6, 4, 2, 17);
    g.fillStyle = '#f4e3bd';
    g.fillRect(9, 6, 9, 13);
    g.fillStyle = '#cdb38a';
    g.fillRect(9, 16, 9, 1);
    g.fillRect(9, 18, 9, 1);
    g.fillStyle = '#e8b07a';
    g.fillRect(11, 9, 5, 4);
    g.fillStyle = '#b87a18';
    g.fillRect(12, 10, 3, 2);
  }

  function drawGoldIcon(g) {
    for (let y = 0; y < 24; y++) {
      for (let x = 0; x < 24; x++) {
        const dx = x + 0.5 - 12;
        const dy = y + 0.5 - 12;
        const d = Math.hypot(dx, dy);
        if (d > 9) continue;
        let col;
        if (d > 7.2) col = '#b87a18';
        else if (d > 5.2) col = '#ffd34e';
        else if (d > 3.8) col = '#fff0b8';
        else continue;
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  }

  function createHeavenlyIcon(kind) {
    const c = makeCanvas(24, 24);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    if (kind === 'crust') g.drawImage(createCrustIcon(), 2, 2, 20, 20);
    else if (kind === 'flame') drawFlameIcon(g);
    else if (kind === 'dough') drawDoughIcon(g);
    else if (kind === 'hand') drawHandIcon(g);
    else if (kind === 'book') drawBookIcon(g);
    else if (kind === 'gold') drawGoldIcon(g);
    else if (kind === 'cook') drawCookIcon(g);
    else if (kind === 'chef') drawChefIcon(g);
    else if (kind === 'pizzeria') drawPizzeriaIcon(g);
    else if (kind === 'pepperoni') g.drawImage(getIngredientIcon('pepperoni'), 0, 0, 24, 24);
    else g.drawImage(getPizzaSprite('plain'), 0, 0, 24, 24);

    return c;
  }

  function createBuildingIcon(id) {
    const key = 'building-' + id;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = makeCanvas(24, 24);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    if (id === 'slice') {
      g.drawImage(getSliceSprites('plain')[0], 2, 2, 20, 20);
    } else if (id === 'cook') {
      drawCookIcon(g);
    } else if (id === 'pizzeria') {
      drawPizzeriaIcon(g);
    } else {
      drawChefIcon(g);
    }

    iconCache.set(key, c);
    return c;
  }

  function createPlateSprite() {
    const W = 100;
    const H = 84;
    const c = makeCanvas(W, H);
    const g = c.getContext('2d');
    const cx = 50;
    const cy = 42;
    const rx = 48;
    const ry = 40;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d = Math.sqrt(nx * nx + ny * ny);
        if (d > 1) continue;

        let col;
        const light = nx + ny;
        const h = (x * 13 + y * 7) % 53;

        if (d > 0.965) {
          col = '#5b4a38';
        } else if (d > 0.84) {
          col = light < -0.55 ? '#fffaf0' : light > 0.65 ? '#c8b795' : '#efe3c9';
          if (h === 0) col = '#e2d3b4';
        } else if (d > 0.81) {
          col = '#b8a988';
        } else if (d > 0.55) {
          col = light < -0.5 ? '#f2e7cf' : light > 0.6 ? '#d8c9ab' : '#e8dcc2';
          if (d > 0.79) col = '#d2c3a4';
        } else {
          col = light < -0.3 ? '#eadfc6' : '#ddd0b4';
          if (h === 0) col = '#d3c5a8';
        }

        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }

    g.fillStyle = '#fffdf5';
    g.fillRect(29, 13, 4, 1);
    g.fillRect(33, 12, 1, 1);
    g.fillRect(24, 17, 2, 1);
    g.fillRect(66, 62, 3, 1);

    return c;
  }

  function createPlateShadowSprite() {
    const W = 100;
    const H = 84;
    const c = makeCanvas(W, H);
    const g = c.getContext('2d');
    g.fillStyle = '#000';

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const nx = (x + 0.5 - 50) / 48;
        const ny = (y + 0.5 - 42) / 40;
        if (nx * nx + ny * ny <= 1) g.fillRect(x, y, 1, 1);
      }
    }

    return c;
  }

  function drawLogoIcon() {
    logoCtx.imageSmoothingEnabled = false;
    logoCtx.clearRect(0, 0, 20, 20);
    logoCtx.drawImage(getPizzaSprite('plain'), 0, 0, 20, 20);
  }

  /* ---------- Layout / scene ---------- */

  function computeLayout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 900;
    const compact = mobile && vh < 560;
    const storeReserve = mobile ? (compact ? vh * 0.52 : Math.min(vh * 0.46, 380)) : 0;
    const topReserve = mobile ? (compact ? 100 : 140) : 0;
    let plateW;

    if (mobile) {
      plateW = Math.min(vw * 0.84, (vh - storeReserve - topReserve) * 1.05, 560);
      plateW = Math.max(plateW, compact ? 120 : 200);
    } else {
      plateW = Math.min(vw * 0.46, vh * 0.66, 660);
      plateW = Math.max(plateW, 300);
    }

    const plateH = plateW * 0.84;
    let cx = vw / 2;
    if (!mobile) {
      const storeLeft = vw - 384;
      cx = Math.min(vw / 2, storeLeft - 16 - plateW / 2);
    }
    const cy = mobile
      ? topReserve + (vh - storeReserve - topReserve) / 2 + 8
      : vh * 0.54;
    const pizzaSize = plateW * 0.6;

    return {
      vw,
      vh,
      mobile,
      compact,
      storeReserve,
      topReserve,
      plateW,
      plateH,
      cx,
      cy,
      pizzaSize,
      sliceSize: clamp(plateW * 0.085, 30, 46)
    };
  }

  function drawPizzaCanvas() {
    const size = Math.max(1, Math.round(layout.pizzaSize * dpr));
    els.pizza.width = size;
    els.pizza.height = size;
    pizzaCtx.setTransform(1, 0, 0, 1, 0, 0);
    pizzaCtx.imageSmoothingEnabled = false;
    pizzaCtx.clearRect(0, 0, size, size);
    pizzaCtx.drawImage(getPizzaSprite(displayRecipeKey, state.skin), 0, 0, size, size);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    layout = computeLayout();

    els.scene.width = Math.floor(layout.vw * dpr);
    els.scene.height = Math.floor(layout.vh * dpr);
    els.scene.style.width = layout.vw + 'px';
    els.scene.style.height = layout.vh + 'px';
    sceneCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sceneCtx.imageSmoothingEnabled = false;

    els.pizzaWrap.style.width = layout.pizzaSize + 'px';
    els.pizzaWrap.style.height = layout.pizzaSize + 'px';
    els.pizzaWrap.style.left = layout.cx + 'px';
    els.pizzaWrap.style.top = layout.cy + 'px';

    if (els.hint) {
      els.hint.style.left = layout.cx + 'px';
      els.hint.style.top = (layout.cy - layout.plateH / 2 - 28) + 'px';
    }

    drawPizzaCanvas();
    renderScene(performance.now());
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function getSlicePos(i, L) {
    if (i < PLATE_CAP) {
      const a = -Math.PI / 2 + (i / PLATE_CAP) * Math.PI * 2;
      const rx = L.plateW * 0.40;
      const ry = L.plateH * 0.43;
      const variant = ((Math.round((a + Math.PI / 2) / (Math.PI / 2)) % 4) + 4) % 4;
      return {
        x: L.cx + Math.cos(a) * rx,
        y: L.cy + Math.sin(a) * ry,
        variant,
        scale: 0.9 + ((i * 7) % 4) * 0.025,
        onPlate: true
      };
    }

    const k = i - PLATE_CAP;
    const a = k * 2.399963 + 0.55;
    const margin = 26;
    const bottomLimit = L.vh - margin - (L.mobile ? L.storeReserve : 0);
    const bottom = Math.max(bottomLimit, L.cy + 30);
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    let maxR = Infinity;

    if (Math.abs(cos) > 0.0001) {
      maxR = Math.min(maxR, (L.cx - margin) / Math.abs(cos), (L.vw - margin - L.cx) / Math.abs(cos));
    }
    if (Math.abs(sin) > 0.0001) {
      maxR = Math.min(maxR, (L.cy - margin) / Math.abs(sin), (bottom - L.cy) / Math.abs(sin));
    }
    if (!isFinite(maxR)) maxR = Math.min(L.vw, L.vh) * 0.5;

    const rx = L.plateW / 2;
    const ry = L.plateH / 2;
    const plateRadius = 1 / Math.sqrt((cos * cos) / (rx * rx) + (sin * sin) / (ry * ry));
    const t = Math.min(1, Math.sqrt((k + 1) / (VISUAL_CAP - PLATE_CAP)));
    const baseR = plateRadius + 24 + t * Math.max(0, maxR - plateRadius - 24);
    const jitter = Math.sin(k * 12.9898) * 8;
    const r = Math.min(baseR + jitter, maxR);
    const x = clamp(L.cx + cos * r, margin, L.vw - margin);
    const y = clamp(L.cy + sin * r * 0.94, margin, bottom);

    return {
      x,
      y,
      variant: (i * 7 + 2) % 4,
      scale: 0.82 + ((i * 13) % 8) * 0.035,
      onPlate: false
    };
  }

  function drawSlice(slice, i, now, L) {
    const pos = getSlicePos(i, L);
    const age = now - slice.born;
    const t = reduceMotion ? 1 : clamp(age / 300, 0, 1);
    const pop = reduceMotion ? 1 : easeOutBack(t);
    const size = L.sliceSize * pos.scale * pop;

    if (size <= 0.5) return;

    sceneCtx.save();
    sceneCtx.globalAlpha = (pos.onPlate ? 0.16 : 0.22) * Math.min(1, age / 120);
    sceneCtx.fillStyle = '#000';
    sceneCtx.beginPath();
    sceneCtx.ellipse(pos.x + 3, pos.y + size * 0.34, size * 0.34, size * 0.14, 0, 0, Math.PI * 2);
    sceneCtx.fill();
    sceneCtx.restore();

    const sprites = getSliceSprites(slice.recipe || 'plain');
    sceneCtx.imageSmoothingEnabled = false;
    sceneCtx.drawImage(sprites[pos.variant], pos.x - size / 2, pos.y - size / 2, size, size);
  }

  function renderScene(now) {
    if (!layout) return;
    const L = layout;

    sceneCtx.clearRect(0, 0, L.vw, L.vh);

    sceneCtx.save();
    sceneCtx.globalAlpha = 0.3;
    sceneCtx.drawImage(
      plateShadowSprite,
      L.cx - L.plateW * 0.53,
      L.cy - L.plateH * 0.5 + 14,
      L.plateW * 1.06,
      L.plateH * 1.04
    );
    sceneCtx.restore();

    sceneCtx.imageSmoothingEnabled = false;
    sceneCtx.drawImage(
      plateSprite,
      L.cx - L.plateW / 2,
      L.cy - L.plateH / 2,
      L.plateW,
      L.plateH
    );

    for (let i = 0; i < visualSlices.length; i++) {
      drawSlice(visualSlices[i], i, now, L);
    }
  }

  function addVisualSlice(recipe) {
    if (visualSlices.length >= VISUAL_CAP) return;
    visualSlices.push({ born: performance.now(), recipe: recipe || randomRecipeKey() });
  }

  function buildVisualSlices() {
    visualSlices = [];
    const now = performance.now();
    const n = Math.min(state.clicksOwned, VISUAL_CAP);
    for (let i = 0; i < n; i++) {
      visualSlices.push({ born: now - 10000, recipe: randomRecipeKey() });
    }
  }

  function popPizza() {
    if (reduceMotion) return;
    els.pizzaWrap.classList.remove('recipe-pop');
    void els.pizzaWrap.offsetWidth;
    els.pizzaWrap.classList.add('recipe-pop');
    window.setTimeout(() => els.pizzaWrap.classList.remove('recipe-pop'), 520);
  }

  function pickDisplayRecipe() {
    if (!state.recipes.length) {
      displayRecipeKey = 'plain';
    } else {
      displayRecipeKey = state.recipes[Math.floor(Math.random() * state.recipes.length)];
    }
    lastRecipeSwap = performance.now();
    drawPizzaCanvas();
    popPizza();
  }

  /* ---------- Store ---------- */

  function createSizeIcon() {
    const c = makeCanvas(24, 24);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#2a1408';
    g.fillRect(4, 4, 16, 16);
    g.fillStyle = '#8cc84b';
    g.fillRect(5, 5, 14, 14);
    g.fillStyle = '#2a1408';
    g.fillRect(10, 7, 4, 10);
    g.fillRect(7, 10, 10, 4);
    g.fillStyle = '#d9f3a8';
    g.fillRect(10, 7, 2, 10);
    g.fillRect(7, 10, 10, 2);
    return c;
  }

  function createCardElement(opts) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card ' + (opts.className || '') + (opts.sell ? ' selling' : '') + (opts.blocked ? ' sell-disabled' : '');
    card.dataset.kind = opts.kind;
    card.dataset.id = opts.id;
    card.dataset.unlocked = opts.unlocked ? '1' : '0';
    card.dataset.sell = opts.sell ? '1' : '0';
    if (opts.blocked) card.dataset.blocked = '1';
    if (opts.cost != null) card.dataset.cost = String(opts.cost);
    if (opts.maxed) card.dataset.maxed = '1';
    if (opts.unlockNeed != null) card.dataset.unlock = String(opts.unlockNeed);

    const art = document.createElement('span');
    art.className = 'c-art';
    art.appendChild(opts.icon);

    const body = document.createElement('span');
    body.className = 'c-body';

    const name = document.createElement('span');
    name.className = 'c-name';
    name.textContent = opts.name;
    body.appendChild(name);

    if (opts.desc) {
      const desc = document.createElement('span');
      desc.className = 'c-desc';
      desc.textContent = opts.desc;
      body.appendChild(desc);
    }

    if (opts.cost != null) {
      const cost = document.createElement('span');
      cost.className = 'c-cost';
      const label = document.createElement('span');
      label.className = 'cost-label';
      label.textContent = opts.costLabel || 'Цена:';
      const num = document.createElement('b');
      num.textContent = formatNumber(opts.cost);
      cost.appendChild(label);
      cost.appendChild(document.createTextNode(' '));
      cost.appendChild(num);
      cost.appendChild(document.createTextNode(' ' + pluralSlices(opts.cost)));
      body.appendChild(cost);
    }

    if (opts.extra) {
      const extra = document.createElement('span');
      extra.className = 'c-extra';
      extra.textContent = opts.extra;
      body.appendChild(extra);
    }

    if (opts.unlockText) {
      const line = document.createElement('span');
      line.className = 'unlock-line';
      line.textContent = opts.unlockText;
      body.appendChild(line);
    }

    if (opts.unlockNeed != null) {
      const bar = document.createElement('span');
      bar.className = 'unlock-bar';
      const fill = document.createElement('i');
      fill.className = 'unlock-fill';
      bar.appendChild(fill);
      body.appendChild(bar);
    }

    card.appendChild(art);
    card.appendChild(body);

    if (opts.owned != null) {
      const owned = document.createElement('span');
      owned.className = 'c-owned';
      owned.title = 'Куплено';
      owned.textContent = formatNumber(opts.owned);
      card.appendChild(owned);
    }

    return card;
  }

  function renderBuildings() {
    els.buildings.innerHTML = '';

    const order = ['slice', 'cook', 'pizzeria', 'chef'];

    for (const id of order) {
      const def = BUILDINGS[id];
      const owned = ownedOf(id);
      const sell = storeMode === 'sell';
      const sellable = sellableOf(id);
      const availableChefs = Math.max(0, maxRecipes() - state.chefs);
      const count = sell
        ? Math.min(storeQty, sellable)
        : (id === 'chef' ? Math.min(storeQty, availableChefs) : storeQty);
      const canSell = sell && count > 0;
      const cost = sell
        ? (canSell ? bulkRefundBuilding(id, owned, count) : null)
        : (count > 0 ? bulkCostBuilding(id, owned, count) : null);

      let unlocked = sell ? canSell : true;
      let maxed = false;
      let unlockText = null;
      let extra = null;

      if (id === 'chef') {
        const noIngredient = unlockedIngredients().length === 0;
        const possible = maxRecipes();
        const allRecipesDone = state.recipes.length >= possible;

        if (sell) {
          unlocked = canSell;
          if (!canSell) {
            unlockText = noIngredient ? 'Сначала открой ингредиент' : 'Все шефы заняты рецептами';
          }
        } else {
          maxed = !noIngredient && allRecipesDone;
          unlocked = !noIngredient && !maxed && availableChefs > 0;
          if (noIngredient) unlockText = 'Сначала открой ингредиент';
          else if (maxed) unlockText = 'Все доступные рецепты открыты';
          else if (availableChefs <= 0) unlockText = 'Используй заряды в редакторе';
        }

        extra = state.chefCharges > 0 ? 'Заряды: ' + state.chefCharges : null;
      }

      if (sell) {
        if (!canSell && id !== 'chef') unlockText = 'Нечего продавать';
        if (count > 1) extra = (extra ? extra + ' · ' : '') + 'Продать: ' + count + ' шт.';
      } else if (count > 1) {
        extra = (extra ? extra + ' · ' : '') + 'Купить: ' + count + ' шт.';
      }

      els.buildings.appendChild(createCardElement({
        kind: 'building',
        id,
        className: 'building' + (id === 'chef' ? ' chef' : ''),
        icon: createBuildingIcon(id),
        name: def.name,
        desc: def.desc,
        cost,
        costLabel: sell ? 'Вернуть:' : 'Цена:',
        currency: 'slices',
        sell,
        owned,
        unlocked,
        maxed,
        unlockText,
        extra
      }));
    }
  }

  function renderUpgrades() {
    els.upgrades.innerHTML = '';

    for (const id of INGREDIENT_ORDER) {
      if (state.upgrades.includes(id)) continue;
      const ing = INGREDIENTS[id];
      const unlocked = state.totalSlices >= ing.unlock;

      els.upgrades.appendChild(createCardElement({
        kind: 'upgrade',
        id,
        className: 'upgrade upgrade-' + id,
        icon: getIngredientIcon(id),
        name: ing.upgradeName,
        desc: ing.name + ': ' + ing.upgradeDesc,
        cost: ing.cost,
        unlocked,
        blocked: storeMode === 'sell',
        unlockText: unlocked
          ? null
          : 'Откроется при ' + formatNumber(ing.unlock) + ' ' + pluralSlices(ing.unlock),
        unlockNeed: unlocked ? null : ing.unlock
      }));
    }

    for (const id of ['size2', 'size3']) {
      if (state.upgrades.includes(id)) continue;
      const u = UPGRADES[id];
      const unlocked = u.requires();

      els.upgrades.appendChild(createCardElement({
        kind: 'upgrade',
        id,
        className: 'upgrade upgrade-size',
        icon: createSizeIcon(),
        name: u.name,
        desc: u.desc + ' (сейчас макс. ' + maxRecipeSize() + ')',
        cost: u.cost,
        unlocked,
        blocked: storeMode === 'sell',
        unlockText: unlocked ? null : u.reqText
      }));
    }

    if (!els.upgrades.children.length) {
      const empty = document.createElement('div');
      empty.className = 'store-empty';
      empty.textContent = 'Все прокачки куплены.';
      els.upgrades.appendChild(empty);
    }
  }

  function renderHeavenlyTeaser() {
    els.heavenlySection.innerHTML = '';

    const gain = crustGain();
    const extra = 'Корочки: ' + formatNumber(state.crusts)
      + ' · престиж: ' + formatNumber(prestigeLevel())
      + (gain > 0 ? ' · +' + formatNumber(gain) + ' за восхождение' : '');

    els.heavenlySection.appendChild(createCardElement({
      kind: 'heavenly',
      id: 'tree',
      className: 'upgrade heavenly-teaser',
      icon: createCrustIcon(),
      name: 'Древо корочек',
      desc: 'Постоянные улучшения за восхождения',
      unlocked: true,
      extra
    }));
  }

  function storeSignature() {
    return [
      state.upgrades.join(','),
      state.recipes.length,
      state.chefs,
      state.chefCharges,
      state.pizzerias,
      state.crusts,
      state.heavenly.join(','),
      state.ascensions,
      prestigeLevel(),
      storeMode,
      storeQty,
      state.levels.slice,
      state.levels.cook,
      state.levels.pizzeria,
      state.levels.chef,
      state.mozzarella,
      state.eventUpgrades.join(','),
      (state.eventCooldowns.cult || 0) > Date.now() ? 1 : 0,
      state.market.tomato.stock,
      state.market.cheese.stock,
      state.market.pepperoni.stock,
      state.totalSlices >= 100 ? 1 : 0,
      state.totalSlices >= 1000 ? 1 : 0,
      state.totalSlices >= 10000 ? 1 : 0
    ].join('|');
  }

  function updateCardStates() {
    if (!els.store) return;
    const cards = els.store.querySelectorAll('.card');
    for (const card of cards) {
      if (card.dataset.kind === 'event') {
        const eventOpen = card.dataset.unlocked !== '0';
        const sellBlocked = card.dataset.blocked === '1';
        card.classList.toggle('affordable', eventOpen && !sellBlocked);
        card.classList.toggle('locked', !eventOpen || sellBlocked);
        card.setAttribute('aria-disabled', String(!eventOpen || sellBlocked));
        continue;
      }

      const cost = Number(card.dataset.cost || 0);
      const unlocked = card.dataset.unlocked !== '0';
      const maxed = card.dataset.maxed === '1';
      const blocked = card.dataset.blocked === '1';
      const selling = card.dataset.sell === '1';
      const can = !blocked && unlocked && !maxed && cost > 0 && (selling || state.slices + 1e-9 >= cost);

      card.classList.toggle('affordable', can);
      card.classList.toggle('locked', !can && !maxed);
      card.classList.toggle('maxed', maxed);
      card.setAttribute('aria-disabled', String(!can));

      const fill = card.querySelector('.unlock-fill');
      if (fill) {
        const need = Number(card.dataset.unlock || 1);
        fill.style.width = Math.min(100, (state.totalSlices / need) * 100) + '%';
      }
    }
  }

  function updateEditorButton() {
    const show = state.chefCharges > 0 && unlockedIngredients().length > 0;
    els.editorBtn.hidden = !show;
    if (show) els.chargeCount.textContent = state.chefCharges;
    els.recipeCount.textContent = state.recipes.length;
  }

  function renderStore() {
    renderBuildings();
    renderUpgrades();
    renderHeavenlyTeaser();
    renderEvents();
    updateCardStates();
    updateEditorButton();
    lastStoreSignature = storeSignature();
  }

  /* ---------- Mozzarella / building levels ---------- */

  function levelEffectText(id) {
    const level = buildingLevel(id);
    if (id === 'slice') {
      return level
        ? '+' + level + ' к силе клика'
        : 'Уровни дают +1 к силе клика';
    }
    const pct = level * 5;
    if (id === 'cook') {
      return level ? '+' + pct + '% к производству поваров' : 'Уровни дают +5% к производству поваров';
    }
    if (id === 'pizzeria') {
      return level ? '+' + pct + '% к производству пиццерий' : 'Уровни дают +5% к производству пиццерий';
    }
    return level ? '+' + pct + '% ко всему производству' : 'Уровни дают +5% ко всему производству';
  }

  function drawMozzarellaBig() {
    if (!els.mozzBig) return;
    const g = els.mozzBig.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 48, 48);
    g.drawImage(createMozzarellaIcon(), 0, 0, 48, 48);
  }

  function renderMozzarella() {
    if (!els.mozzBuildings) return;
    els.mozzBuildings.innerHTML = '';

    for (const id of BUILDING_ORDER) {
      const def = BUILDINGS[id];
      const level = buildingLevel(id);

      const card = document.createElement('div');
      card.className = 'mozz-card';
      card.dataset.id = id;

      const head = document.createElement('div');
      head.className = 'mozz-card-head';

      const art = document.createElement('span');
      art.className = 'mozz-art';
      art.appendChild(createBuildingIcon(id));
      head.appendChild(art);

      const name = document.createElement('span');
      name.className = 'mozz-name';
      name.textContent = def.name;
      head.appendChild(name);

      const badge = document.createElement('span');
      badge.className = 'mozz-level';
      badge.textContent = 'Ур. ' + level + ' / ' + MAX_BUILDING_LEVEL;
      head.appendChild(badge);

      card.appendChild(head);

      const effect = document.createElement('div');
      effect.className = 'mozz-effect';
      effect.textContent = levelEffectText(id);
      card.appendChild(effect);

      const actions = document.createElement('div');
      actions.className = 'mozz-actions';

      const up = document.createElement('button');
      up.type = 'button';
      up.className = 'mozz-btn upgrade';
      up.dataset.action = 'level';
      up.dataset.id = id;
      actions.appendChild(up);

      const miniBtn = document.createElement('button');
      miniBtn.type = 'button';
      miniBtn.className = 'mozz-btn mini';
      miniBtn.dataset.action = 'mini';
      miniBtn.dataset.id = id;
      actions.appendChild(miniBtn);

      card.appendChild(actions);
      els.mozzBuildings.appendChild(card);
    }

    drawMozzarellaBig();
    updateMozzarellaLive();
  }

  function updateMozzarellaLive(now) {
    if (!els.mozzModal) return;
    const t = typeof now === 'number' ? now : Date.now();

    els.mozzCount.textContent = formatNumber(state.mozzarella);
    els.mozzFill.style.width = (mozzarellaProgress(t) * 100) + '%';
    const rem = mozzarellaRemaining(t);
    els.mozzStatus.textContent = rem <= 0
      ? 'шарик созрел — сейчас добавится'
      : 'до следующего шарика: ' + formatDuration(rem);

    for (const btn of els.mozzBuildings.querySelectorAll('.mozz-btn')) {
      const id = btn.dataset.id;
      const level = buildingLevel(id);

      if (btn.dataset.action === 'level') {
        const cost = levelCost(id);
        const maxed = level >= MAX_BUILDING_LEVEL;
        btn.disabled = maxed || state.mozzarella < cost;
        btn.textContent = maxed ? 'МАКС. УРОВЕНЬ' : 'УЛУЧШИТЬ · ' + cost + ' ' + pluralBalls(cost);
      } else {
        const left = miniCooldownLeft(id, t);
        const locked = level < 1;
        btn.disabled = locked || left > 0;
        btn.textContent = locked
          ? 'МИНИ-ИГРА · С УР. 1'
          : left > 0
            ? 'МИНИ-ИГРА · ' + formatDuration(left)
            : 'МИНИ-ИГРА';
      }
    }
  }

  function openMozzarella() {
    if (!els.editorModal.hidden) closeEditor();
    if (!els.bookModal.hidden) closeBook();
    if (!els.ascendModal.hidden) closeAscend();
    if (!els.miniModal.hidden) closeMinigame();

    renderMozzarella();
    els.mozzModal.hidden = false;
    els.mozzClose.focus();
  }

  function closeMozzarella() {
    if (!els.miniModal.hidden) closeMinigame();
    els.mozzModal.hidden = true;
    if (els.mozzBtn && !els.mozzBtn.hidden) els.mozzBtn.focus();
  }

  /* ---------- Building minigames ---------- */

  function miniStopTimers() {
    if (mini.raf) cancelAnimationFrame(mini.raf);
    mini.raf = 0;
    for (const timer of mini.timers) clearTimeout(timer);
    mini.timers = [];
    mini.roundTimer = 0;
    mini.active = false;
    mini.id = '';
  }

  function miniTimer(fn, ms) {
    const timer = window.setTimeout(fn, ms);
    mini.timers.push(timer);
    return timer;
  }

  function miniTopline(leftLabel, rightLabel, leftValue, rightValue) {
    const line = document.createElement('div');
    line.className = 'mini-topline';

    const left = document.createElement('span');
    left.appendChild(document.createTextNode(leftLabel + ' '));
    const leftB = document.createElement('b');
    leftB.textContent = leftValue;
    left.appendChild(leftB);
    line.appendChild(left);

    const right = document.createElement('span');
    right.appendChild(document.createTextNode(rightLabel + ' '));
    const rightB = document.createElement('b');
    rightB.textContent = rightValue;
    right.appendChild(rightB);
    line.appendChild(right);

    return line;
  }

  function miniHint(text) {
    const hint = document.createElement('p');
    hint.className = 'mini-hint';
    hint.textContent = text;
    return hint;
  }

  function endMinigame(title, text, rewards) {
    if (!mini.active) return;
    const id = mini.id;
    miniStopTimers();

    const lines = [];
    if (rewards) rewards(lines);

    state.miniCooldowns[id] = Date.now() + (MINIGAMES[id] ? MINIGAMES[id].cooldown : MINI_COOLDOWN);
    saveGame();
    updateHud();
    renderMozzarella();

    els.miniBody.innerHTML = '';

    const box = document.createElement('div');
    box.className = 'mini-result';

    const h = document.createElement('h3');
    h.textContent = title;
    box.appendChild(h);

    const p = document.createElement('p');
    p.textContent = text;
    box.appendChild(p);

    for (const line of lines) {
      const reward = document.createElement('div');
      reward.className = 'mini-reward';
      reward.textContent = line;
      box.appendChild(reward);
    }

    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'pixel-btn';
    done.textContent = 'ЗАКРЫТЬ';
    done.addEventListener('click', closeMinigame);
    box.appendChild(done);

    els.miniBody.appendChild(box);
  }

  function startCookGame() {
    els.miniBody.innerHTML = '';
    els.miniBody.appendChild(miniHint('Останови бегунок в зелёной зоне.'));

    const track = document.createElement('div');
    track.className = 'mini-track';

    const marker = document.createElement('span');
    marker.className = 'mini-marker';
    track.appendChild(marker);

    els.miniBody.appendChild(track);

    const legend = document.createElement('div');
    legend.className = 'mini-legend';
    legend.innerHTML = '<span class="good">хорошо</span><span class="perfect">идеально</span><span class="good">хорошо</span>';
    els.miniBody.appendChild(legend);

    const actions = document.createElement('div');
    actions.className = 'mini-actions';
    const stop = document.createElement('button');
    stop.type = 'button';
    stop.className = 'pixel-btn';
    stop.textContent = 'СТОП';
    actions.appendChild(stop);
    els.miniBody.appendChild(actions);

    const start = performance.now();
    const tick = (now) => {
      if (!mini.active || mini.id !== 'cook') return;
      const cycle = ((now - start) / 1150) % 2;
      const pos = cycle <= 1 ? cycle : 2 - cycle;
      mini.pos = pos;
      marker.style.left = (pos * 100) + '%';
      mini.raf = window.requestAnimationFrame(tick);
    };
    mini.raf = window.requestAnimationFrame(tick);

    stop.addEventListener('click', () => {
      if (!mini.active || mini.id !== 'cook') return;
      const pos = mini.pos;
      const perfect = pos >= 0.42 && pos <= 0.58;
      const good = !perfect && ((pos >= 0.28 && pos < 0.42) || (pos > 0.58 && pos <= 0.72));

      endMinigame(
        perfect ? 'ИДЕАЛЬНО!' : good ? 'НЕПЛОХО' : 'СОУС ПРИГОРЕЛ',
        perfect
          ? 'Соус получился точно по рецепту.'
          : good
            ? 'Почти идеально, но можно лучше.'
            : 'Бегунок остановился слишком далеко.',
        (lines) => {
          if (perfect) {
            addBuff('cook', 'Идеальный соус', 120000, 3, 0);
            lines.push('×3 к производству на 2 минуты');
          } else if (good) {
            addBuff('cook', 'Хороший соус', 60000, 1.5, 0);
            lines.push('×1,5 к производству на 1 минуту');
          } else {
            const n = grantSlices(Math.max(10, cps() * 8));
            lines.push('+' + formatNumber(n) + ' ' + pluralSlices(n) + ' за старание');
          }
        }
      );
    });
  }

  function startSliceGame() {
    els.miniBody.innerHTML = '';

    const scoreEl = document.createElement('b');
    scoreEl.textContent = '0';
    const clockEl = document.createElement('b');
    clockEl.textContent = '6';

    const line = document.createElement('div');
    line.className = 'mini-topline';
    const left = document.createElement('span');
    left.appendChild(document.createTextNode('Разрезов: '));
    left.appendChild(scoreEl);
    const right = document.createElement('span');
    right.appendChild(document.createTextNode('Осталось: '));
    right.appendChild(clockEl);
    right.appendChild(document.createTextNode(' с'));
    line.appendChild(left);
    line.appendChild(right);
    els.miniBody.appendChild(line);

    const cut = document.createElement('button');
    cut.type = 'button';
    cut.className = 'mini-cut';
    const cv = makeCanvas(112, 112);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(getPizzaSprite('plain'), 0, 0, 112, 112);
    cut.appendChild(cv);
    els.miniBody.appendChild(cut);
    els.miniBody.appendChild(miniHint('Кликай по пицце как можно быстрее.'));

    mini.clicks = 0;
    const endAt = Date.now() + 6000;

    cut.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (!mini.active || mini.id !== 'slice') return;
      mini.clicks += 1;
      scoreEl.textContent = mini.clicks;
      cut.classList.remove('cut');
      void cut.offsetWidth;
      cut.classList.add('cut');
    });

    const tick = () => {
      if (!mini.active || mini.id !== 'slice') return;
      const leftMs = Math.max(0, endAt - Date.now());
      clockEl.textContent = Math.ceil(leftMs / 1000);
      if (leftMs <= 0) {
        const clicks = mini.clicks;
        endMinigame(
          clicks >= 25 ? 'МОЛНИЕНОСНАЯ НАРЕЗКА' : 'НАРЕЗАНО',
          'Разрезов: ' + clicks + '.',
          (lines) => {
            const gained = grantSlices(Math.max(10, clicks * Math.max(1, clickPower()) * 2));
            lines.push('+' + formatNumber(gained) + ' ' + pluralSlices(gained));
            if (clicks >= 25) {
              addBuff('slice', 'Острая нарезка', 120000, 1, 5);
              lines.push('+5 к силе клика на 2 минуты');
            }
          }
        );
        return;
      }
      miniTimer(tick, 200);
    };
    tick();
  }

  function startPizzeriaGame() {
    els.miniBody.innerHTML = '';

    const scoreEl = document.createElement('b');
    scoreEl.textContent = '0';
    const clockEl = document.createElement('b');
    clockEl.textContent = '12';

    const line = document.createElement('div');
    line.className = 'mini-topline';
    const left = document.createElement('span');
    left.appendChild(document.createTextNode('Обслужено: '));
    left.appendChild(scoreEl);
    const right = document.createElement('span');
    right.appendChild(document.createTextNode('Осталось: '));
    right.appendChild(clockEl);
    right.appendChild(document.createTextNode(' с'));
    line.appendChild(left);
    line.appendChild(right);
    els.miniBody.appendChild(line);

    const arena = document.createElement('div');
    arena.className = 'mini-arena';
    els.miniBody.appendChild(arena);
    els.miniBody.appendChild(miniHint('Кликай по гостям, пока они не ушли.'));

    mini.score = 0;
    const endAt = Date.now() + 12000;

    const spawn = () => {
      if (!mini.active || mini.id !== 'pizzeria') return;

      const guest = document.createElement('button');
      guest.type = 'button';
      guest.className = 'mini-guest';

      const cv = makeCanvas(40, 40);
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(getPizzaSprite('plain'), 0, 0, 40, 40);
      guest.appendChild(cv);

      guest.style.left = (8 + Math.random() * 76) + '%';
      guest.style.top = (6 + Math.random() * 72) + '%';

      guest.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!mini.active || mini.id !== 'pizzeria') return;
        guest.remove();
        mini.score += 1;
        scoreEl.textContent = mini.score;
      });

      arena.appendChild(guest);
      miniTimer(() => guest.remove(), 1500);
      miniTimer(spawn, 620);
    };

    spawn();

    const tick = () => {
      if (!mini.active || mini.id !== 'pizzeria') return;
      const leftMs = Math.max(0, endAt - Date.now());
      clockEl.textContent = Math.ceil(leftMs / 1000);

      if (leftMs <= 0) {
        const served = mini.score;
        endMinigame(
          served >= 12 ? 'ПОЛНАЯ ОЧЕРЕДЬ' : served >= 6 ? 'СМЕНА ЗАКРЫТА' : 'ОЧЕРЕДЬ УБЕЖАЛА',
          'Обслужено гостей: ' + served + '.',
          (lines) => {
            const gained = grantSlices(Math.max(15, cps() * (4 + served * 2)));
            lines.push('+' + formatNumber(gained) + ' ' + pluralSlices(gained));
            if (served >= 8) {
              addBuff('pizzeria', 'Полная очередь', 90000, 2, 0);
              lines.push('×2 к производству на 1,5 минуты');
            }
          }
        );
        return;
      }
      miniTimer(tick, 200);
    };
    tick();
  }

  function startChefGame() {
    els.miniBody.innerHTML = '';

    const roundEl = document.createElement('b');
    roundEl.textContent = '1';
    const scoreEl = document.createElement('b');
    scoreEl.textContent = '0';

    const line = document.createElement('div');
    line.className = 'mini-topline';
    const left = document.createElement('span');
    left.appendChild(document.createTextNode('Раунд: '));
    left.appendChild(roundEl);
    left.appendChild(document.createTextNode(' / 3'));
    const right = document.createElement('span');
    right.appendChild(document.createTextNode('Найдено: '));
    right.appendChild(scoreEl);
    line.appendChild(left);
    line.appendChild(right);
    els.miniBody.appendChild(line);

    const tiles = document.createElement('div');
    tiles.className = 'mini-tiles';
    els.miniBody.appendChild(tiles);
    els.miniBody.appendChild(miniHint('Найди ингредиент, который отличается от остальных.'));

    mini.score = 0;
    mini.round = 1;

    const nextRound = () => {
      if (!mini.active || mini.id !== 'chef') return;
      if (mini.round > 3) {
        const found = mini.score;
        endMinigame(
          found === 3 ? 'ИДЕАЛЬНЫЙ ВКУС' : found >= 2 ? 'ПОЧТИ ШЕДЕВР' : 'ДЕГУСТАЦИЯ ПРОВАЛЕНА',
          'Угадано раундов: ' + found + ' из 3.',
          (lines) => {
            if (found === 3) {
              state.chefCharges += 1;
              state.chefs = Math.max(state.chefs, state.recipes.length + state.chefCharges);
              lines.push('+1 заряд редактора рецептов');
            } else {
              const gained = grantSlices(Math.max(10, cps() * (3 + found * 3)));
              lines.push('+' + formatNumber(gained) + ' ' + pluralSlices(gained));
            }
          }
        );
        return;
      }

      roundEl.textContent = mini.round;
      const base = INGREDIENT_ORDER[Math.floor(Math.random() * INGREDIENT_ORDER.length)];
      let odd = INGREDIENT_ORDER[Math.floor(Math.random() * INGREDIENT_ORDER.length)];
      while (odd === base) {
        odd = INGREDIENT_ORDER[Math.floor(Math.random() * INGREDIENT_ORDER.length)];
      }
      mini.odd = Math.floor(Math.random() * 6);

      tiles.innerHTML = '';
      for (let i = 0; i < 6; i++) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'mini-tile';
        tile.dataset.index = String(i);
        const icon = getIngredientIcon(i === mini.odd ? odd : base);
        const cv = makeCanvas(40, 40);
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(icon, 0, 0, 40, 40);
        tile.appendChild(cv);
        tile.addEventListener('click', () => {
          if (!mini.active || mini.id !== 'chef' || tile.disabled) return;
          const correct = i === mini.odd;
          for (const other of tiles.querySelectorAll('.mini-tile')) other.disabled = true;
          tile.classList.add(correct ? 'correct' : 'wrong');
          if (correct) {
            mini.score += 1;
            scoreEl.textContent = mini.score;
          }
          window.clearTimeout(mini.roundTimer);
          miniRoundTimerNext();
        });
        tiles.appendChild(tile);
      }

      mini.roundTimer = miniTimer(() => {
        for (const tile of tiles.querySelectorAll('.mini-tile')) tile.disabled = true;
        miniRoundTimerNext();
      }, 6000);
    };

    const miniRoundTimerNext = () => {
      if (!mini.active || mini.id !== 'chef') return;
      mini.round += 1;
      miniTimer(nextRound, 520);
    };

    nextRound();
  }

  function openMinigame(id) {
    const def = MINIGAMES[id];
    if (!def) return;

    if (buildingLevel(id) < 1) {
      showToast('Сначала прокачай постройку до 1 уровня');
      return;
    }

    const left = miniCooldownLeft(id);
    if (left > 0) {
      showToast('Мини-игра перезаряжается: ' + formatDuration(left));
      return;
    }

    miniStopTimers();
    mini.id = id;
    mini.active = true;
    mini.score = 0;
    mini.round = 0;
    mini.clicks = 0;
    mini.pos = 0;

    els.miniTitle.textContent = def.name;
    els.miniSub.textContent = def.sub;
    els.miniBody.innerHTML = '';
    els.miniModal.hidden = false;
    els.miniClose.focus();

    if (id === 'cook') startCookGame();
    else if (id === 'pizzeria') startPizzeriaGame();
    else if (id === 'chef') startChefGame();
    else startSliceGame();
  }

  function closeMinigame() {
    miniStopTimers();
    els.miniModal.hidden = true;
    renderMozzarella();
    if (!els.mozzModal.hidden) els.mozzClose.focus();
    else if (els.mozzBtn && !els.mozzBtn.hidden) els.mozzBtn.focus();
  }

  /* ---------- Events ---------- */

  function hasEventUpgrade(id) {
    return state.eventUpgrades.includes(id);
  }

  function renderEvents() {
    if (!els.eventsSection) return;
    els.eventsSection.innerHTML = '';

    const cultLeft = Math.max(0, (state.eventCooldowns.cult || 0) - Date.now());
    els.eventsSection.appendChild(createCardElement({
      kind: 'event',
      id: 'cult',
      className: 'event-card cult-card',
      icon: createCultistIcon(),
      name: 'Храм волосатые усы',
      desc: 'Культисты крадут куски. Успей прокликать — уничтожишь и вернёшь в 1,5 раза больше.',
      extra: cultLeft > 0 ? 'Перезарядка: ' + formatDuration(cultLeft) : 'Событие доступно',
      unlocked: cultLeft <= 0,
      blocked: storeMode === 'sell'
    }));

    const owned = hasEventUpgrade('valorant');
    els.eventsSection.appendChild(createCardElement({
      kind: 'event',
      id: 'valorant',
      className: 'event-card valorant-card',
      icon: createValorantIcon(),
      name: 'Валорант',
      desc: owned ? 'Биржа ингредиентов открыта.' : 'Ивентовое улучшение: биржа ингредиентов.',
      cost: owned ? null : VALORANT_COST,
      costLabel: 'Цена:',
      extra: owned ? 'ОТКРЫТЬ БИРЖУ' : 'Купи, чтобы торговать',
      unlocked: owned || state.slices >= VALORANT_COST,
      blocked: storeMode === 'sell'
    }));

    updateEventsLive();
  }

  function updateEventsLive(now) {
    if (!els.eventsSection) return;
    const t = typeof now === 'number' ? now : Date.now();
    const cult = els.eventsSection.querySelector('.card[data-id="cult"]');
    if (!cult) return;

    const left = Math.max(0, (state.eventCooldowns.cult || 0) - t);
    const extra = cult.querySelector('.c-extra');
    if (extra) extra.textContent = left > 0 ? 'Перезарядка: ' + formatDuration(left) : 'Событие доступно';
    cult.dataset.unlocked = left <= 0 ? '1' : '0';
    cult.classList.toggle('locked', left > 0 || storeMode === 'sell');
  }

  function clearCultTimers() {
    if (cultEvent.tick) window.clearInterval(cultEvent.tick);
    if (cultEvent.escape) window.clearTimeout(cultEvent.escape);
    if (cultEvent.next) window.clearTimeout(cultEvent.next);
    cultEvent.tick = 0;
    cultEvent.escape = 0;
    cultEvent.next = 0;
  }

  function updateCultistUi() {
    const el = cultEvent.el;
    if (!el) return;
    const fill = el.querySelector('.cultist-hp i');
    if (fill) fill.style.width = (cultEvent.maxHp > 0 ? (cultEvent.hp / cultEvent.maxHp) * 100 : 0) + '%';
    const stolen = el.querySelector('.cultist-stolen');
    if (stolen) stolen.textContent = '−' + formatNumber(cultEvent.stolen);
  }

  function stealTick() {
    if (!cultEvent.active || !cultEvent.el) return;
    const amount = Math.min(
      state.slices,
      Math.max(1, Math.floor(state.slices * 0.01) + Math.floor(cps() * 0.5))
    );
    if (!(amount > 0)) return;
    state.slices -= amount;
    cultEvent.stolen += amount;
    updateCultistUi();
    updateHud();
  }

  function hitCultist() {
    if (!cultEvent.active || !cultEvent.el) return;
    cultEvent.hp -= 1;
    const el = cultEvent.el;
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
    updateCultistUi();
    if (cultEvent.hp <= 0) destroyCultist();
  }

  function destroyCultist() {
    if (!cultEvent.active) return;
    clearCultTimers();

    const el = cultEvent.el;
    cultEvent.el = null;
    const stolen = cultEvent.stolen;
    const reward = Math.floor(stolen * 1.5);

    if (el) {
      el.disabled = true;
      el.classList.add('destroyed');
      window.setTimeout(() => el.remove(), 380);
    }

    if (reward > 0) grantSlices(reward);
    updateHud();
    saveGame();
    showToast(reward > 0
      ? 'Культист уничтожен! +' + formatNumber(reward) + ' ' + pluralSlices(reward)
      : 'Культист уничтожен!');

    if (cultEvent.active) cultEvent.next = window.setTimeout(spawnCultist, 720);
  }

  function escapeCultist() {
    if (!cultEvent.active || !cultEvent.el) return;
    clearCultTimers();

    const el = cultEvent.el;
    cultEvent.el = null;
    const stolen = cultEvent.stolen;

    if (el) {
      el.disabled = true;
      el.classList.add('escaped');
      window.setTimeout(() => el.remove(), 320);
    }

    updateHud();
    saveGame();
    showToast(stolen > 0
      ? 'Культист сбежал с ' + formatNumber(stolen) + ' ' + pluralSlices(stolen)
      : 'Культист сбежал');

    if (cultEvent.active) cultEvent.next = window.setTimeout(spawnCultist, 700);
  }

  function spawnCultist() {
    if (!cultEvent.active) return;

    cultEvent.wave += 1;
    if (cultEvent.wave > 3) {
      endCultEvent(true);
      return;
    }

    cultEvent.hp = 5 + cultEvent.wave * 2;
    cultEvent.maxHp = cultEvent.hp;
    cultEvent.stolen = 0;
    els.eventStatus.textContent = 'Волна ' + cultEvent.wave + ' / 3';

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'cultist';
    el.style.left = (24 + Math.random() * 52) + '%';
    el.style.top = (30 + Math.random() * 32) + '%';

    const art = makeCanvas(72, 72);
    const g = art.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(createCultistIcon(), 0, 0, 72, 72);
    el.appendChild(art);

    const hp = document.createElement('span');
    hp.className = 'cultist-hp';
    hp.appendChild(document.createElement('i'));
    el.appendChild(hp);

    const stolen = document.createElement('span');
    stolen.className = 'cultist-stolen';
    stolen.textContent = '−0';
    el.appendChild(stolen);

    const hint = document.createElement('span');
    hint.className = 'cultist-hint';
    hint.textContent = 'КЛИК';
    el.appendChild(hint);

    el.addEventListener('click', (event) => {
      event.stopPropagation();
      hitCultist();
    });

    els.eventStage.appendChild(el);
    cultEvent.el = el;
    updateCultistUi();

    cultEvent.tick = window.setInterval(stealTick, 1000);
    cultEvent.escape = window.setTimeout(escapeCultist, 10000);
  }

  function startCultEvent() {
    if (cultEvent.active) return;

    const left = Math.max(0, (state.eventCooldowns.cult || 0) - Date.now());
    if (left > 0) {
      showToast('Храм откроется через ' + formatDuration(left));
      return;
    }

    if (!els.editorModal.hidden) closeEditor();
    if (!els.bookModal.hidden) closeBook();
    if (!els.ascendModal.hidden) closeAscend();
    if (!els.mozzModal.hidden) closeMozzarella();
    if (!els.marketModal.hidden) closeMarket();

    cultEvent = {
      active: true, wave: 0, hp: 0, maxHp: 0, stolen: 0,
      tick: 0, escape: 0, next: 0, el: null
    };

    els.eventLayer.hidden = false;
    els.eventStage.innerHTML = '';
    els.eventStatus.textContent = 'Культисты приближаются...';
    spawnCultist();
  }

  function endCultEvent(completed) {
    if (!cultEvent.active) return;
    cultEvent.active = false;
    clearCultTimers();

    els.eventLayer.hidden = true;
    els.eventStage.innerHTML = '';
    cultEvent.el = null;

    state.eventCooldowns.cult = Date.now() + CULT_COOLDOWN;
    saveGame();
    updateHud();
    renderStore();

    showToast(completed
      ? 'Все культисты повержены! Храм закрыт.'
      : 'Ты покинул храм. Культисты затаились.');
  }

  /* ---------- Valorant ingredient market ---------- */

  function marketMood(id, price) {
    const ratio = price / MARKET_BASE[id];
    if (ratio <= 0.85) return { cls: 'low', text: 'НИЗКАЯ' };
    if (ratio >= 1.15) return { cls: 'high', text: 'ВЫСОКАЯ' };
    return { cls: 'mid', text: 'СРЕДНЯЯ' };
  }

  function marketPrice(price) {
    return formatNumber(Math.max(1, Math.round(price)));
  }

  function openMarket() {
    if (!hasEventUpgrade('valorant')) {
      showToast('Сначала купи улучшение «Валорант»');
      return;
    }

    if (!els.editorModal.hidden) closeEditor();
    if (!els.bookModal.hidden) closeBook();
    if (!els.ascendModal.hidden) closeAscend();
    if (!els.mozzModal.hidden) closeMozzarella();
    if (!els.miniModal.hidden) closeMinigame();

    renderMarket();
    els.marketModal.hidden = false;
    els.marketClose.focus();
  }

  function closeMarket() {
    els.marketModal.hidden = true;
    els.mozzBtn.focus();
  }

  function renderMarket() {
    els.marketGrid.innerHTML = '';

    for (const id of INGREDIENT_ORDER) {
      const ing = INGREDIENTS[id];

      const row = document.createElement('div');
      row.className = 'market-row';
      row.dataset.id = id;

      const art = document.createElement('span');
      art.className = 'market-art';
      art.appendChild(getIngredientIcon(id));
      row.appendChild(art);

      const info = document.createElement('div');
      info.className = 'market-info';

      const name = document.createElement('span');
      name.className = 'market-name';
      name.textContent = ing.name;
      info.appendChild(name);

      const price = document.createElement('span');
      price.className = 'market-price';
      const priceVal = document.createElement('b');
      priceVal.dataset.role = 'price';
      priceVal.textContent = '0';
      const mood = document.createElement('em');
      mood.dataset.role = 'mood';
      mood.className = 'market-mood mid';
      mood.textContent = 'СРЕДНЯЯ';
      const trend = document.createElement('span');
      trend.dataset.role = 'trend';
      trend.className = 'market-trend';
      trend.textContent = '▲';
      price.appendChild(priceVal);
      price.appendChild(document.createTextNode(' кусков '));
      price.appendChild(mood);
      price.appendChild(document.createTextNode(' '));
      price.appendChild(trend);
      info.appendChild(price);

      const owned = document.createElement('span');
      owned.className = 'market-owned';
      owned.appendChild(document.createTextNode('В запасе: '));
      const stock = document.createElement('b');
      stock.dataset.role = 'stock';
      stock.textContent = '0';
      owned.appendChild(stock);
      info.appendChild(owned);

      const lock = document.createElement('span');
      lock.className = 'market-lock free';
      lock.dataset.role = 'lock';
      lock.textContent = 'Цикл свободен';
      info.appendChild(lock);

      row.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'market-actions';

      for (const [act, qty] of [['sell', 1], ['sell', 10], ['buy', 1], ['buy', 10]]) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'market-btn ' + act;
        btn.dataset.act = act;
        btn.dataset.qty = String(qty);
        btn.dataset.id = id;
        btn.textContent = (act === 'buy' ? '+' : '−') + qty;
        btn.title = (act === 'buy' ? 'Купить ' : 'Продать ') + qty;
        actions.appendChild(btn);
      }

      row.appendChild(actions);
      els.marketGrid.appendChild(row);
    }

    updateMarketLive();
    drawMarketChart();
  }

  function pushMarketHistory(market, price) {
    if (!Array.isArray(market.history)) market.history = [];
    market.history.push(price);
    if (market.history.length > MARKET_HISTORY) {
      market.history.splice(0, market.history.length - MARKET_HISTORY);
    }
  }

  function drawMarketChart() {
    const canvas = els.marketChart;
    if (!canvas) return;

    const g = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const left = 52;
    const right = W - 14;
    const top = 20;
    const bottom = H - 28;
    const plotW = right - left;
    const plotH = bottom - top;
    const yMin = 0.35;
    const yMax = 2.35;

    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);

    g.fillStyle = '#140d08';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#1f130b';
    g.fillRect(left, top, plotW, plotH);

    const yFor = (ratio) => bottom - ((clamp(ratio, yMin, yMax) - yMin) / (yMax - yMin)) * plotH;
    const xFor = (index, count) => left + (count > 1 ? (plotW * index) / (count - 1) : plotW);

    g.font = '10px "Pixelify Sans", monospace';
    g.textBaseline = 'middle';
    g.textAlign = 'right';

    for (const ratio of [0.5, 1, 1.5, 2]) {
      const y = Math.round(yFor(ratio)) + 0.5;
      g.strokeStyle = 'rgba(143, 106, 74, 0.35)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(left, y);
      g.lineTo(right, y);
      g.stroke();

      g.fillStyle = '#a98a62';
      g.fillText(Math.round(ratio * 100) + '%', left - 7, y);
    }

    const baseY = Math.round(yFor(1)) + 0.5;
    g.strokeStyle = 'rgba(255, 211, 78, 0.5)';
    g.setLineDash([5, 5]);
    g.beginPath();
    g.moveTo(left, baseY);
    g.lineTo(right, baseY);
    g.stroke();
    g.setLineDash([]);

    g.fillStyle = '#8b6b4c';
    g.textAlign = 'left';
    g.fillText('ИСТОРИЯ', left, H - 11);
    g.textAlign = 'right';
    g.fillText('СЕЙЧАС', right, H - 11);

    if (els.marketLegend) els.marketLegend.innerHTML = '';

    for (const id of INGREDIENT_ORDER) {
      const market = state.market[id];
      if (!market) continue;
      const base = MARKET_BASE[id];
      const history = Array.isArray(market.history) && market.history.length
        ? market.history
        : [market.price];
      const color = MARKET_COLORS[id];

      g.strokeStyle = color;
      g.lineWidth = 3;
      g.lineJoin = 'miter';
      g.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = Math.round(xFor(i, history.length));
        const y = Math.round(yFor(history[i] / base));
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();

      const lastX = Math.round(xFor(history.length - 1, history.length));
      const lastY = Math.round(yFor(history[history.length - 1] / base));
      g.fillStyle = color;
      g.fillRect(lastX - 3, lastY - 3, 6, 6);

      if (els.marketLegend) {
        const item = document.createElement('span');
        const dot = document.createElement('i');
        dot.style.background = color;
        item.appendChild(dot);

        const name = document.createElement('b');
        name.textContent = INGREDIENTS[id].short;
        item.appendChild(name);

        const pct = Math.round((market.price / base - 1) * 100);
        item.appendChild(document.createTextNode(
          ' ' + marketPrice(market.price) + ' · ' + (pct >= 0 ? '+' : '') + pct + '%'
        ));
        els.marketLegend.appendChild(item);
      }
    }
  }

  function updateMarketLive() {
    if (!els.marketModal) return;

    if (els.marketSlices) els.marketSlices.textContent = formatNumber(state.slices);
    if (els.marketNext) {
      const left = Math.max(0, MARKET_INTERVAL - (Date.now() - (state.marketUpdatedAt || 0)));
      els.marketNext.textContent = left <= 0 ? 'сейчас' : formatDuration(left);
    }

    for (const row of els.marketGrid.querySelectorAll('.market-row')) {
      const id = row.dataset.id;
      const m = state.market[id];
      if (!m) continue;

      const priceEl = row.querySelector('[data-role="price"]');
      if (priceEl) priceEl.textContent = marketPrice(m.price);

      const mood = marketMood(id, m.price);
      const moodEl = row.querySelector('[data-role="mood"]');
      if (moodEl) {
        moodEl.textContent = mood.text;
        moodEl.className = 'market-mood ' + mood.cls;
      }

      const trendEl = row.querySelector('[data-role="trend"]');
      if (trendEl) {
        const up = m.price >= m.prev;
        trendEl.textContent = up ? '▲' : '▼';
        trendEl.className = 'market-trend ' + (up ? 'up' : 'down');
      }

      const stockEl = row.querySelector('[data-role="stock"]');
      if (stockEl) stockEl.textContent = formatNumber(m.stock);

      const lockEl = row.querySelector('[data-role="lock"]');
      if (lockEl) {
        const lock = m.lock === 'buy' || m.lock === 'sell' ? m.lock : '';
        lockEl.textContent = lock === 'buy'
          ? 'Куплено в этом цикле'
          : lock === 'sell'
            ? 'Продано в этом цикле'
            : 'Цикл свободен';
        lockEl.className = 'market-lock ' + (lock || 'free');
      }

      for (const btn of row.querySelectorAll('.market-btn')) {
        const qty = Number(btn.dataset.qty);
        const act = btn.dataset.act;
        const total = act === 'buy' ? Math.ceil(m.price * qty) : Math.floor(m.price * qty);
        const label = (act === 'buy' ? 'Купить ' : 'Продать ') + qty + ' за ' + marketPrice(total);
        btn.title = label;
        btn.setAttribute('aria-label', label);
        if (m.lock && m.lock !== act) {
          btn.disabled = true;
        } else if (act === 'buy') {
          btn.disabled = state.slices < Math.ceil(m.price * qty) || m.stock + qty > 9999;
        } else {
          btn.disabled = m.stock < qty;
        }
      }
    }
  }

  function tickMarket(force) {
    const now = Date.now();
    if (!force && now - (state.marketUpdatedAt || 0) < MARKET_INTERVAL) return false;

    state.marketUpdatedAt = now;

    for (const id of INGREDIENT_ORDER) {
      const m = state.market[id];
      if (!m) continue;
      const base = MARKET_BASE[id];
      m.prev = m.price;
      m.lock = '';
      const swing = 0.62 + Math.random() * 0.76;
      m.price = clamp(m.price * swing, base * 0.4, base * 2.3);
      pushMarketHistory(m, m.price);
    }

    saveGame();
    if (!els.marketModal.hidden) {
      updateMarketLive();
      drawMarketChart();
    }
    return true;
  }

  let marketDeltaTimer = 0;

  function flashMarketDelta(amount) {
    if (!els.marketDelta) return;
    els.marketDelta.textContent = (amount > 0 ? '+' : '−') + marketPrice(Math.abs(amount));
    els.marketDelta.className = 'market-delta ' + (amount > 0 ? 'plus' : 'minus');
    void els.marketDelta.offsetWidth;
    els.marketDelta.classList.add('show');
    window.clearTimeout(marketDeltaTimer);
    marketDeltaTimer = window.setTimeout(() => {
      els.marketDelta.classList.remove('show');
    }, 1500);
  }

  function marketTrade(id, act, qty) {
    const m = state.market[id];
    if (!m) return;

    const ing = INGREDIENTS[id];
    let spent = 0;
    let earned = 0;

    if (m.lock && m.lock !== act) {
      showToast(m.lock === 'buy'
        ? 'Уже куплено в этом цикле — продать можно после смены цены'
        : 'Уже продано в этом цикле — купить можно после смены цены');
      return;
    }

    if (act === 'buy') {
      const cost = Math.ceil(m.price * qty);
      if (!(cost > 0) || !isFinite(cost)) return;
      if (state.slices < cost) {
        showToast('Не хватает кусков');
        return;
      }
      if (m.stock + qty > 9999) {
        showToast('Склад полон');
        return;
      }
      state.slices = Math.max(0, state.slices - cost);
      m.stock += qty;
      spent = cost;
    } else {
      if (m.stock < qty) {
        showToast('Недостаточно ингредиента');
        return;
      }
      const gain = Math.floor(m.price * qty);
      m.stock -= qty;
      grantSlices(gain);
      earned = gain;
    }

    m.lock = act;

    if (act === 'buy') {
      flashMarketDelta(-spent);
      showToast('Куплено: ' + qty + ' × ' + ing.name + ' · −' + marketPrice(spent) + ' кусков');
    } else {
      flashMarketDelta(earned);
      showToast('Продано: ' + qty + ' × ' + ing.name + ' · +' + marketPrice(earned) + ' кусков');
    }

    updateHud();
    saveGame();
    updateMarketLive();
  }

  function buyValorant(card) {
    if (hasEventUpgrade('valorant')) {
      openMarket();
      return;
    }

    if (state.slices < VALORANT_COST) {
      if (card) flashClass(card, 'shake', 360);
      showToast('Нужно ' + formatNumber(VALORANT_COST) + ' кусков');
      return;
    }

    state.slices -= VALORANT_COST;
    state.eventUpgrades.push('valorant');
    saveGame();
    updateHud();
    renderStore();
    showToast('Ивентовое улучшение: Валорант');
    openMarket();
  }

  /* ---------- Ascension / heavenly tree ---------- */

  function treeNodePos(def) {
    const xs = [0.16, 0.5, 0.84];
    const ys = [0.09, 0.295, 0.5, 0.705, 0.91];
    return { x: xs[def.col] * 100, y: ys[def.tier] * 100 };
  }

  function renderTree() {
    for (const old of els.treeCanvas.querySelectorAll('.tree-node')) old.remove();
    els.treeLines.innerHTML = '';

    const NS = 'http://www.w3.org/2000/svg';

    for (const id of HEAVENLY_ORDER) {
      const def = HEAVENLY[id];
      const pos = treeNodePos(def);
      const owned = hasHeavenly(id);
      const available = !owned && def.req.every(hasHeavenly);
      const affordable = available && state.crusts >= def.cost;

      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'tree-node'
        + (owned ? ' bought' : available ? (affordable ? ' affordable' : ' available') : ' locked');
      node.dataset.id = id;
      node.style.left = pos.x + '%';
      node.style.top = pos.y + '%';

      const icon = document.createElement('span');
      icon.className = 'tree-icon';
      icon.appendChild(createHeavenlyIcon(def.icon));
      node.appendChild(icon);

      const name = document.createElement('span');
      name.className = 'tree-name';
      name.textContent = def.name;
      node.appendChild(name);

      const desc = document.createElement('span');
      desc.className = 'tree-desc';
      desc.textContent = def.desc;
      node.appendChild(desc);

      const cost = document.createElement('span');
      cost.className = 'tree-cost';
      if (owned) {
        cost.textContent = 'КУПЛЕНО';
      } else if (!available) {
        cost.textContent = 'НУЖНО: ' + def.req.map((r) => HEAVENLY[r].name).join(', ');
      } else {
        cost.textContent = def.cost + ' ' + pluralCrusts(def.cost);
      }
      node.appendChild(cost);

      els.treeCanvas.appendChild(node);
    }

    for (const id of HEAVENLY_ORDER) {
      const def = HEAVENLY[id];
      const to = treeNodePos(def);

      for (const req of def.req) {
        const from = treeNodePos(HEAVENLY[req]);
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y + 7);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y - 7);
        line.setAttribute('class', 'tree-line' + (hasHeavenly(req) ? ' lit' : ''));
        els.treeLines.appendChild(line);
      }
    }
  }

  function renderAscend() {
    const level = prestigeLevel();
    const gain = crustGain();

    els.ascendLevel.textContent = formatNumber(level);
    els.ascendBonus.textContent = '+' + formatNumber(level) + '% к производству';
    els.ascendCrusts.textContent = formatNumber(state.crusts);
    els.ascendGain.textContent = '+' + formatNumber(gain);
    els.ascendBtn.disabled = gain <= 0;
    els.ascendBtn.textContent = gain > 0 ? 'ВОЗНЕСТИСЬ' : 'МАЛО КУСКОВ';

    renderTree();
  }

  function openAscend() {
    if (!els.editorModal.hidden) closeEditor();
    if (!els.bookModal.hidden) closeBook();

    renderAscend();
    els.ascendModal.hidden = false;
    els.ascendClose.focus();
  }

  function closeAscend() {
    els.ascendModal.hidden = true;
    if (!els.treeBtn.hidden) els.treeBtn.focus();
  }

  function buyHeavenly(id, node) {
    const def = HEAVENLY[id];
    if (!def || hasHeavenly(id)) return;

    if (!def.req.every(hasHeavenly)) {
      flashClass(node, 'shake', 360);
      showToast('Сначала купи: ' + def.req.map((r) => HEAVENLY[r].name).join(', '));
      return;
    }

    if (state.crusts < def.cost) {
      flashClass(node, 'shake', 360);
      showToast('Не хватает корочек');
      return;
    }

    state.crusts -= def.cost;
    state.heavenly.push(id);

    renderAscend();
    updateHud();
    renderStore();
    saveGame();
    showToast('Древо: ' + def.name);
  }

  function resetRun() {
    const keep = hasHeavenly('book');
    const upgrades = keep ? state.upgrades.slice() : [];
    const recipes = keep ? state.recipes.slice() : [];

    state.slices = 0;
    state.clicksOwned = 0;
    state.cooks = 0;
    state.pizzerias = 0;
    state.chefs = 0;
    state.chefCharges = 0;
    state.upgrades = upgrades;
    state.recipes = recipes;

    if (hasHeavenly('dough')) state.slices += 100;
    if (hasHeavenly('apprentice')) state.cooks += 1;
    if (hasHeavenly('cheflegacy')) {
      state.chefs += 1;
      state.chefCharges += 1;
    }

    if (state.recipes.length) {
      state.chefs = Math.max(state.chefs, state.recipes.length + state.chefCharges);
    }

    displayRecipeKey = state.recipes.length ? state.recipes[0] : 'plain';
    lastRecipeSwap = performance.now();
    lastCountText = '';
    buildVisualSlices();
    updateEditorButton();
  }

  function ascend() {
    const gain = crustGain();
    if (gain <= 0) {
      showToast('Сначала заработай больше кусков');
      return;
    }

    state.crusts += gain;
    state.crustsEarned += crustGainBase();
    state.ascensions += 1;
    resetRun();

    saveGame();
    closeAscend();
    updateHud();
    renderStore();
    drawPizzaCanvas();
    showToast('Восхождение ' + state.ascensions + '! +' + formatNumber(gain) + ' ' + pluralCrusts(gain));
  }

  /* ---------- HUD ---------- */

  function updatePlateStatus() {
    const onPlate = Math.min(state.clicksOwned, PLATE_CAP);
    if (state.clicksOwned < PLATE_CAP) {
      els.plateStatus.textContent = 'На тарелке: ' + onPlate + ' / ' + PLATE_CAP;
      els.plateStatusWrap.classList.remove('full');
    } else {
      els.plateStatus.textContent = 'Тарелка полна · кусков: ' + formatNumber(state.clicksOwned);
      els.plateStatusWrap.classList.add('full');
    }
  }

  function updateProgressHud() {
    const level = prestigeLevel();
    const start = Math.pow(level, 3) * CRUST_DIVISOR;
    const next = Math.pow(level + 1, 3) * CRUST_DIVISOR;
    const pct = next > start
      ? clamp(((state.totalSlices - start) / (next - start)) * 100, 0, 100)
      : 0;

    els.prestigeLevel.textContent = formatNumber(level);
    els.prestigeBonus.textContent = '+' + formatNumber(level) + '%';
    els.crustFill.style.width = pct + '%';
    els.crusts.textContent = formatNumber(state.crusts);
    els.multiplier.textContent = '×' + formatMultiplier(productionMultiplier());
  }

  function updateBuffRow(now) {
    if (!els.buffRow) return;
    const t = typeof now === 'number' ? now : Date.now();
    const buffs = activeBuffs(t);
    if (!buffs.length) {
      els.buffRow.hidden = true;
      return;
    }
    const soonest = buffs.reduce((a, b) => (a.until < b.until ? a : b));
    const more = buffs.length > 1 ? ' · ещё ' + (buffs.length - 1) : '';
    els.buffRow.hidden = false;
    els.buffText.textContent = soonest.name + more + ' · ' + formatDuration(soonest.until - t);
  }

  function updateMozzarellaHud(now) {
    if (!els.mozzarella) return;
    const t = typeof now === 'number' ? now : Date.now();
    els.mozzarella.textContent = formatNumber(state.mozzarella);
    if (els.mozzFillHud) els.mozzFillHud.style.width = (mozzarellaProgress(t) * 100) + '%';
    if (els.mozzBtn) els.mozzBtn.classList.toggle('ready', state.mozzarella > 0);
    updateBuffRow(t);
  }

  function updateHud() {
    const shown = formatNumber(state.slices);
    els.count.textContent = shown;
    els.countWord.textContent = pluralSlices(state.slices);
    els.cps.textContent = formatRate(cps());
    els.clickPower.textContent = '+' + formatNumber(clickPower());
    els.total.textContent = formatNumber(state.totalSlices);
    lastCountText = shown;
    updateProgressHud();
    updatePlateStatus();
    updateMozzarellaHud();
    updateCardStates();
    updateEditorButton();
  }

  function checkUnlockToasts() {
    for (const id of INGREDIENT_ORDER) {
      const ing = INGREDIENTS[id];
      if (!unlockNotified[id] && state.totalSlices >= ing.unlock && !state.upgrades.includes(id)) {
        unlockNotified[id] = true;
        showToast('Новая прокачка в магазине: ' + ing.upgradeName);
      }
    }
  }

  function syncUnlockNotified() {
    for (const id of INGREDIENT_ORDER) {
      if (state.totalSlices >= INGREDIENTS[id].unlock) unlockNotified[id] = true;
    }
  }

  function updateLiveText() {
    const shown = formatNumber(state.slices);
    if (shown !== lastCountText) {
      els.count.textContent = shown;
      els.countWord.textContent = pluralSlices(state.slices);
      lastCountText = shown;
    }
    els.cps.textContent = formatRate(cps());
    els.clickPower.textContent = '+' + formatNumber(clickPower());
    els.total.textContent = formatNumber(state.totalSlices);
    updateProgressHud();
    updateCardStates();
    checkUnlockToasts();
  }

  /* ---------- Actions ---------- */

  function canAfford(cost) {
    return state.slices + 1e-9 >= cost;
  }

  function spend(cost) {
    state.slices = Math.max(0, state.slices - cost);
  }

  function afterPurchase(id) {
    updateHud();
    renderStore();
    saveGame();
    if (!id) return;
    const newCard = els.store.querySelector('.card[data-id="' + id + '"]');
    if (newCard) flashClass(newCard, 'bought', 300);
  }

  function buyBuilding(id, card) {
    const def = BUILDINGS[id];
    if (!def) return;
    const qty = Math.max(1, Math.floor(storeQty));

    if (id === 'chef') {
      if (!unlockedIngredients().length) {
        flashClass(card, 'shake', 360);
        showToast('Сначала открой хотя бы один ингредиент');
        return;
      }

      const possible = maxRecipes();
      if (state.recipes.length >= possible) {
        flashClass(card, 'shake', 360);
        showToast('Все доступные рецепты открыты');
        return;
      }

      const available = Math.max(0, possible - state.chefs);
      if (available <= 0) {
        flashClass(card, 'shake', 360);
        showToast('Сначала используй заряды в редакторе');
        return;
      }

      const count = Math.min(qty, available);
      const cost = bulkCostBuilding('chef', state.chefs, count);
      if (!canAfford(cost)) {
        flashClass(card, 'shake', 360);
        return;
      }

      spend(cost);
      state.chefs += count;
      state.chefCharges += count;
      afterPurchase(id);
      openEditor();
      return;
    }

    const count = qty;
    const cost = bulkCostBuilding(id, ownedOf(id), count);
    if (!canAfford(cost)) {
      flashClass(card, 'shake', 360);
      return;
    }

    spend(cost);

    if (id === 'slice') {
      state.clicksOwned += count;
      for (let i = 0; i < count; i++) addVisualSlice(randomRecipeKey());
    } else if (id === 'cook') {
      state.cooks += count;
    } else if (id === 'pizzeria') {
      state.pizzerias += count;
    }

    afterPurchase(id);
  }

  function sellBuilding(id, card) {
    const def = BUILDINGS[id];
    if (!def) return;

    const sellable = sellableOf(id);
    if (sellable <= 0) {
      flashClass(card, 'shake', 360);
      showToast(id === 'chef' ? 'Все шефы заняты рецептами' : 'Нечего продавать');
      return;
    }

    const count = Math.min(Math.max(1, Math.floor(storeQty)), sellable);
    const refund = bulkRefundBuilding(id, ownedOf(id), count);

    if (id === 'slice') {
      state.clicksOwned -= count;
      buildVisualSlices();
    } else if (id === 'cook') {
      state.cooks -= count;
    } else if (id === 'pizzeria') {
      state.pizzerias -= count;
    } else if (id === 'chef') {
      state.chefs -= count;
    }

    state.slices += refund;
    afterPurchase(id);
    showToast('Продано: ' + count + ' · +' + formatNumber(refund) + ' ' + pluralSlices(refund));
  }

  function buyUpgrade(id, card) {
    const u = UPGRADES[id];
    if (!u || state.upgrades.includes(id)) return;
    if (storeMode === 'sell') {
      showToast('Прокачки нельзя продать');
      return;
    }

    const unlocked = u.kind === 'ingredient'
      ? state.totalSlices >= u.unlock
      : u.requires();

    if (!unlocked) {
      flashClass(card, 'shake', 360);
      return;
    }
    if (!canAfford(u.cost)) {
      flashClass(card, 'shake', 360);
      return;
    }

    spend(u.cost);
    state.upgrades.push(id);

    if (u.kind === 'ingredient') {
      showToast('Ингредиент открыт: ' + INGREDIENTS[id].name);
    } else {
      showToast('Теперь в рецепте до ' + maxRecipeSize() + ' ингредиентов');
    }

    afterPurchase(null);
  }

  function syncStoreToolbar() {
    if (els.buyModeBtn) {
      els.buyModeBtn.classList.toggle('active', storeMode === 'buy');
      els.buyModeBtn.setAttribute('aria-pressed', String(storeMode === 'buy'));
    }
    if (els.sellModeBtn) {
      els.sellModeBtn.classList.toggle('active', storeMode === 'sell');
      els.sellModeBtn.setAttribute('aria-pressed', String(storeMode === 'sell'));
    }
    for (const btn of els.qtyBtns) {
      const qty = Number(btn.dataset.qty);
      btn.classList.toggle('active', qty === storeQty);
      btn.setAttribute('aria-pressed', String(qty === storeQty));
    }
  }

  function setStoreMode(mode) {
    storeMode = mode === 'sell' ? 'sell' : 'buy';
    syncStoreToolbar();
    renderStore();
  }

  function setStoreQty(qty) {
    storeQty = qty === 10 || qty === 100 ? qty : 1;
    syncStoreToolbar();
    renderStore();
  }

  function spawnFloater(x, y, amount) {
    const el = document.createElement('div');
    el.className = 'floater';
    el.textContent = '+' + formatNumber(amount);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--dx', (Math.random() * 44 - 22).toFixed(1) + 'px');
    els.floaters.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function spawnCrumbs(x, y) {
    if (reduceMotion) return;
    const colors = ['#f5c845', '#d98a32', '#b83424', '#7fbe45', '#ffe27a'];

    for (let i = 0; i < 5; i++) {
      const el = document.createElement('div');
      el.className = 'crumb';
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 46;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.background = colors[i % colors.length];
      el.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      el.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
      el.style.setProperty('--rot', (Math.random() * 360 - 180).toFixed(0) + 'deg');
      els.floaters.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
  }

  function hideHint() {
    if (!els.hint) return;
    els.hint.classList.add('hidden');
    window.setTimeout(() => {
      if (els.hint && els.hint.parentNode) els.hint.remove();
    }, 420);
  }

  function clickPizza(x, y) {
    const gain = clickPower();
    state.slices += gain;
    state.totalSlices += gain;

    if (!hasClicked) {
      hasClicked = true;
      hideHint();
    }

    updateHud();
    spawnFloater(x, y, gain);
    spawnCrumbs(x, y);

    if (!reduceMotion) {
      els.count.animate(
        [
          { transform: 'scale(1.16)' },
          { transform: 'scale(1)' }
        ],
        { duration: 150, easing: 'ease-out' }
      );
    }
  }

  /* ---------- Recipe editor (Plinko race) ---------- */

  const race = {
    active: false,
    raf: 0,
    last: 0,
    elapsed: 0,
    targetSize: 1,
    pegs: [],
    balls: [],
    finishOrder: [],
    winners: [],
    result: null,
    width: 0,
    height: 0,
    dpr: 1,
    scale: 1
  };

  function pluralIngredients(n) {
    const mod100 = Math.floor(Math.abs(n)) % 100;
    const mod10 = mod100 % 10;
    if (mod100 > 10 && mod100 < 20) return 'ингредиентов';
    if (mod10 === 1) return 'ингредиент';
    if (mod10 >= 2 && mod10 <= 4) return 'ингредиента';
    return 'ингредиентов';
  }

  function resizeEditor() {
    const wrap = els.plinko.parentElement;
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(0, Math.round(rect.width));
    const h = Math.max(0, Math.round(rect.height));
    if (w < 10 || h < 10) return;

    race.width = w;
    race.height = h;
    race.dpr = Math.min(window.devicePixelRatio || 1, 2);
    race.scale = clamp(w / 640, 0.6, 1.1);

    els.plinko.width = Math.round(w * race.dpr);
    els.plinko.height = Math.round(h * race.dpr);
    els.plinko.style.width = w + 'px';
    els.plinko.style.height = h + 'px';

    plinkoCtx.setTransform(race.dpr, 0, 0, race.dpr, 0, 0);
    plinkoCtx.imageSmoothingEnabled = false;
  }

  function buildPegs() {
    const W = race.width;
    const H = race.height;
    race.pegs = [];
    if (W < 20 || H < 20) return;

    const rows = clamp(Math.floor(H / 58), 4, 9);
    const startY = Math.max(78, H * 0.18);
    const endY = H - 96;
    const rowGap = (endY - startY) / Math.max(1, rows - 1);
    const cols = Math.max(4, Math.floor(W / 78));
    const colGap = W / (cols + 1);
    const pegR = 5 * race.scale;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * colGap / 2;
      for (let c = 0; c < cols; c++) {
        const x = colGap * (c + 1) + offset + (Math.random() * 8 - 4);
        if (x < 14 || x > W - 14) continue;
        const y = startY + r * rowGap + (Math.random() * 8 - 4);
        race.pegs.push({ x, y, r: pegR });
      }
    }
  }

  function makeBalls(waiting) {
    const ings = unlockedIngredients();
    const W = race.width;
    const n = ings.length;
    const spacing = W / (n + 1);

    return ings.map((id, i) => {
      const ing = INGREDIENTS[id];
      const r = ing.r * race.scale;
      const x = clamp(spacing * (i + 1) + (Math.random() * 26 - 13), r + 8, W - r - 8);

      return {
        id,
        x,
        y: waiting ? 34 + (Math.random() * 8 - 4) : 28 + (Math.random() * 10 - 5),
        vx: waiting ? 0 : (Math.random() * 2 - 1) * 50,
        vy: 0,
        r,
        mass: ing.mass,
        gravity: 1500 * ing.gravity * (0.9 + Math.random() * 0.2),
        restitution: ing.restitution,
        finished: false,
        finishTime: 0,
        waiting,
        trail: []
      };
    });
  }

  function resetRaceBoard() {
    race.active = false;
    if (race.raf) cancelAnimationFrame(race.raf);
    race.raf = 0;
    race.last = 0;
    race.elapsed = 0;
    race.finishOrder = [];
    race.winners = [];
    race.result = null;
    race.targetSize = 1;

    resizeEditor();
    buildPegs();
    race.balls = makeBalls(true);

    els.raceBtn.hidden = false;
    els.raceBtn.disabled = false;
    els.raceBtn.textContent = 'ЗАПУСТИТЬ ГОНКУ';
    els.acceptBtn.hidden = true;

    drawRace();
  }

  function startRace() {
    if (race.active) return;
    if (state.chefCharges <= 0) {
      showToast('Сначала купи шеф-повара');
      return;
    }
    if (!unlockedIngredients().length) {
      showToast('Сначала открой хотя бы один ингредиент');
      return;
    }
    if (state.recipes.length >= maxRecipes()) {
      showToast('Все доступные рецепты открыты');
      return;
    }

    resizeEditor();
    if (race.width < 10 || race.height < 10) return;

    if (race.raf) cancelAnimationFrame(race.raf);
    race.raf = 0;
    race.elapsed = 0;
    race.finishOrder = [];
    race.winners = [];
    race.result = null;
    race.targetSize = 1 + Math.floor(Math.random() * maxRecipeSize());

    buildPegs();
    race.balls = makeBalls(false);
    race.active = true;
    race.last = 0;
    race.raf = requestAnimationFrame(raceLoop);

    els.raceBtn.hidden = false;
    els.raceBtn.disabled = true;
    els.raceBtn.textContent = 'ГОНКА...';
    els.acceptBtn.hidden = true;
    setEditorResultText('Шеф бросает ингредиенты... Цель: ' + race.targetSize + ' ' + pluralIngredients(race.targetSize) + '.');
  }

  function raceLoop(now) {
    if (!race.active) return;
    if (!race.last) race.last = now;

    let dt = (now - race.last) / 1000;
    race.last = now;
    dt = Math.min(dt, 0.04);

    const steps = Math.max(1, Math.ceil(dt / 0.012));
    const sub = dt / steps;
    for (let i = 0; i < steps; i++) stepRace(sub);

    drawRace();
    if (race.active) race.raf = requestAnimationFrame(raceLoop);
  }

  function stepRace(dt) {
    const W = race.width;
    const H = race.height;
    const finishY = H - 74;
    const needed = Math.min(race.targetSize, race.balls.length);

    for (const b of race.balls) {
      if (b.finished) continue;

      b.vy += b.gravity * dt;
      b.vx *= 0.998;
      b.vy *= 0.999;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x - b.r < 6) {
        b.x = 6 + b.r;
        b.vx = Math.abs(b.vx) * 0.62;
      }
      if (b.x + b.r > W - 6) {
        b.x = W - 6 - b.r;
        b.vx = -Math.abs(b.vx) * 0.62;
      }

      for (const p of race.pegs) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const minD = b.r + p.r;
        const d2 = dx * dx + dy * dy;

        if (d2 < minD * minD && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          b.x = p.x + nx * minD;
          b.y = p.y + ny * minD;

          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            b.vx -= (1 + b.restitution) * vn * nx;
            b.vy -= (1 + b.restitution) * vn * ny;
          }

          b.vx += (Math.random() * 2 - 1) * 50;
          b.vy *= 0.96;
        }
      }

      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 7) b.trail.shift();

      if (b.y - b.r > finishY) {
        b.finished = true;
        b.finishTime = race.elapsed;
        race.finishOrder.push(b);
      }
    }

    race.elapsed += dt;

    if (!race.result && race.finishOrder.length >= needed) {
      race.winners = race.finishOrder.slice(0, needed).map((b) => b.id);
      showRaceResult();
      for (const b of race.balls) {
        if (!b.finished) b.gravity *= 2.2;
      }
    }

    const allDone = race.balls.every((b) => b.finished);
    if (allDone || race.elapsed > 10) {
      if (!race.result) {
        const sorted = race.balls.slice().sort((a, b) => b.y - a.y);
        race.winners = sorted.slice(0, needed).map((b) => b.id);
        showRaceResult();
      }
      stopRace();
    }
  }

  function showRaceResult() {
    const key = recipeKey(race.winners);
    const duplicate = state.recipes.includes(key);
    race.result = { key, ingredients: race.winners.slice(), duplicate };

    renderEditorResult();

    if (duplicate) {
      els.acceptBtn.hidden = true;
      els.raceBtn.hidden = false;
      els.raceBtn.disabled = false;
      els.raceBtn.textContent = 'ПОВТОРИТЬ ГОНКУ';
    } else {
      els.acceptBtn.hidden = false;
      els.raceBtn.hidden = true;
    }
  }

  function stopRace() {
    race.active = false;
    if (race.raf) cancelAnimationFrame(race.raf);
    race.raf = 0;
    race.last = 0;

    if (race.result) {
      if (race.result.duplicate) {
        els.raceBtn.hidden = false;
        els.raceBtn.disabled = false;
        els.raceBtn.textContent = 'ПОВТОРИТЬ ГОНКУ';
        els.acceptBtn.hidden = true;
      } else {
        els.raceBtn.hidden = true;
        els.acceptBtn.hidden = false;
      }
    } else {
      els.raceBtn.hidden = false;
      els.raceBtn.disabled = false;
      els.raceBtn.textContent = 'ЗАПУСТИТЬ ГОНКУ';
      els.acceptBtn.hidden = true;
    }

    drawRace();
  }

  function drawRaceBall(g, id, x, y, r, tray) {
    const ing = INGREDIENTS[id];
    g.save();
    g.translate(Math.round(x), Math.round(y));

    g.fillStyle = 'rgba(0, 0, 0, 0.35)';
    g.beginPath();
    g.ellipse(2, r * 0.55, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#2a1408';
    g.beginPath();
    g.arc(0, 0, r + 1.5, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = ing.color;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();

    if (id === 'tomato') {
      g.fillStyle = '#f4e3bd';
      g.fillRect(Math.round(-r * 0.4), Math.round(-r * 0.85), Math.max(2, Math.round(r * 0.8)), Math.max(2, Math.round(r * 0.3)));
      g.fillStyle = '#cdb38a';
      g.fillRect(Math.round(-r * 0.4), Math.round(-r * 0.55), Math.max(2, Math.round(r * 0.8)), 1);
      g.fillStyle = '#4d8b2a';
      g.fillRect(Math.round(r * 0.2), Math.round(-r * 0.95), Math.max(2, Math.round(r * 0.25)), Math.max(2, Math.round(r * 0.2)));
      g.fillStyle = '#e05a3a';
      g.fillRect(Math.round(-r * 0.5), Math.round(-r * 0.25), Math.max(2, Math.round(r * 0.3)), Math.round(r * 0.9));
    } else if (id === 'cheese') {
      g.fillStyle = '#b08d2c';
      g.beginPath();
      g.arc(r * 0.25, -r * 0.15, r * 0.3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#2a1408';
      g.beginPath();
      g.arc(r * 0.25, -r * 0.15, r * 0.2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffe9a8';
      g.fillRect(Math.round(-r * 0.55), Math.round(-r * 0.5), Math.max(2, Math.round(r * 0.4)), Math.max(1, Math.round(r * 0.25)));
    } else {
      g.fillStyle = '#d9533c';
      g.beginPath();
      g.arc(-r * 0.35, -r * 0.3, r * 0.22, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(r * 0.3, r * 0.15, r * 0.18, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(-r * 0.1, r * 0.45, r * 0.15, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#7e1f16';
      g.fillRect(Math.round(-r * 0.5), Math.round(-r * 0.55), Math.max(2, Math.round(r * 0.2)), Math.max(1, Math.round(r * 0.12)));
    }

    g.strokeStyle = '#2a1408';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();

    if (tray) {
      g.fillStyle = '#ffd34e';
      g.fillRect(-1, Math.round(-r - 10), 2, 4);
    }

    g.restore();
  }

  function drawRace() {
    const W = race.width;
    const H = race.height;
    if (W < 10 || H < 10) return;

    const g = plinkoCtx;
    g.setTransform(race.dpr, 0, 0, race.dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.imageSmoothingEnabled = false;

    g.fillStyle = '#1a0e08';
    g.fillRect(0, 0, W, H);

    const grad = g.createRadialGradient(W / 2, H * 0.35, 20, W / 2, H * 0.35, W * 0.75);
    grad.addColorStop(0, 'rgba(255, 168, 76, 0.10)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    g.strokeStyle = 'rgba(255, 211, 78, 0.04)';
    g.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      g.beginPath();
      g.moveTo(x + 0.5, 0);
      g.lineTo(x + 0.5, H);
      g.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      g.beginPath();
      g.moveTo(0, y + 0.5);
      g.lineTo(W, y + 0.5);
      g.stroke();
    }

    const finishY = H - 74;

    for (let x = 0; x < W; x += 10) {
      for (let row = 0; row < 2; row++) {
        g.fillStyle = ((Math.floor(x / 10) + row) % 2 === 0) ? '#f4e3bd' : '#2a1408';
        g.fillRect(x, finishY + row * 6, 10, 6);
      }
    }

    g.font = '10px "Pixelify Sans", monospace';
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#a88762';
    g.fillText('В РЕЦЕПТ', 8, finishY - 8);

    g.fillStyle = 'rgba(0, 0, 0, 0.35)';
    g.fillRect(0, finishY + 12, W, H - finishY - 12);

    for (const p of race.pegs) {
      g.fillStyle = 'rgba(0, 0, 0, 0.4)';
      g.beginPath();
      g.arc(p.x + 2, p.y + 2, p.r, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#c9963c';
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#ffe9a8';
      g.fillRect(
        Math.round(p.x - p.r * 0.35),
        Math.round(p.y - p.r * 0.5),
        Math.max(1, Math.round(p.r * 0.5)),
        Math.max(1, Math.round(p.r * 0.35))
      );
    }

    for (const b of race.balls) {
      if (b.waiting || b.finished) continue;
      for (let i = 0; i < b.trail.length; i++) {
        const t = b.trail[i];
        g.globalAlpha = (i / b.trail.length) * 0.18;
        g.fillStyle = INGREDIENTS[b.id].color;
        g.beginPath();
        g.arc(t.x, t.y, b.r * (0.35 + (i / b.trail.length) * 0.4), 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;

    const trayIds = race.result ? race.winners : race.finishOrder.map((b) => b.id);
    const shown = trayIds.slice(0, 3);
    if (shown.length) {
      const gap = 46;
      const startX = W / 2 - ((shown.length - 1) * gap) / 2;
      for (let i = 0; i < shown.length; i++) {
        const x = startX + i * gap;
        const y = H - 31;
        const r = Math.min(16, (INGREDIENTS[shown[i]].r + 2) * race.scale);
        g.fillStyle = 'rgba(255, 211, 78, 0.16)';
        g.beginPath();
        g.arc(x, y, r + 5, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = '#ffd34e';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(x, y, r + 5, 0, Math.PI * 2);
        g.stroke();
        drawRaceBall(g, shown[i], x, y, r, true);
      }
    }

    for (const b of race.balls) {
      if (b.finished) continue;
      drawRaceBall(g, b.id, b.x, b.y, b.r, false);
    }

    if (race.balls.length && race.balls[0].waiting) {
      g.font = '10px "Pixelify Sans", monospace';
      g.fillStyle = '#a88762';
      g.textAlign = 'center';
      g.fillText('ШЕФ ГОТОВ', W / 2, 16);
    }
  }

  function setEditorResultText(text) {
    els.editorResult.innerHTML = '';
    const div = document.createElement('div');
    div.textContent = text;
    els.editorResult.appendChild(div);
  }

  function renderEditorResult() {
    els.editorResult.innerHTML = '';

    if (race.result) {
      const { key, ingredients, duplicate } = race.result;

      const status = document.createElement('div');
      status.className = duplicate ? 'result-dup' : 'result-new';
      status.textContent = duplicate ? 'Такой рецепт уже есть' : 'Новый рецепт!';

      const name = document.createElement('div');
      name.className = 'result-name';
      name.textContent = recipeName(key);

      const list = document.createElement('div');
      list.className = 'result-ings';

      for (const id of ingredients) {
        const chip = document.createElement('span');
        chip.className = 'mini-ing';
        const c = makeCanvas(14, 14);
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(getIngredientIcon(id), 0, 0, 14, 14);
        chip.appendChild(c);
        chip.appendChild(document.createTextNode(INGREDIENTS[id].short));
        list.appendChild(chip);
      }

      els.editorResult.appendChild(status);
      els.editorResult.appendChild(name);
      els.editorResult.appendChild(list);

      if (duplicate) {
        const hint = document.createElement('div');
        hint.style.marginTop = '5px';
        hint.textContent = 'Шеф предлагает попробовать ещё раз.';
        els.editorResult.appendChild(hint);
      }
      return;
    }

    if (race.active) {
      setEditorResultText('Шеф бросает ингредиенты...');
      return;
    }

    setEditorResultText('Запусти гонку, чтобы шеф выбрал ингредиенты.');
  }

  function renderEditorSide() {
    const ings = unlockedIngredients();
    const slots = Math.min(maxRecipeSize(), ings.length);
    els.slotCount.textContent = slots;

    els.editorIngredients.innerHTML = '';
    for (const id of INGREDIENT_ORDER) {
      const ing = INGREDIENTS[id];
      const unlocked = state.upgrades.includes(id);

      const chip = document.createElement('div');
      chip.className = 'ingredient-chip' + (unlocked ? '' : ' locked');

      const iconWrap = document.createElement('span');
      iconWrap.className = 'chip-icon';
      iconWrap.appendChild(getIngredientIcon(id));

      const body = document.createElement('span');
      body.className = 'chip-body';

      const name = document.createElement('span');
      name.className = 'chip-name';
      name.textContent = ing.name;

      const tag = document.createElement('span');
      tag.className = 'chip-tag';
      tag.textContent = unlocked ? ing.tag : 'не открыт';

      body.appendChild(name);
      body.appendChild(tag);
      chip.appendChild(iconWrap);
      chip.appendChild(body);
      els.editorIngredients.appendChild(chip);
    }

    renderEditorResult();

    if (race.active) {
      els.raceBtn.hidden = false;
      els.raceBtn.disabled = true;
      els.raceBtn.textContent = 'ГОНКА...';
    } else if (race.result) {
      if (race.result.duplicate) {
        els.raceBtn.hidden = false;
        els.raceBtn.disabled = false;
        els.raceBtn.textContent = 'ПОВТОРИТЬ ГОНКУ';
        els.acceptBtn.hidden = true;
      } else {
        els.raceBtn.hidden = true;
        els.acceptBtn.hidden = false;
      }
    } else {
      els.raceBtn.hidden = false;
      els.raceBtn.disabled = ings.length === 0 || state.recipes.length >= maxRecipes();
      els.raceBtn.textContent = 'ЗАПУСТИТЬ ГОНКУ';
      els.acceptBtn.hidden = true;
    }
  }

  function openEditor() {
    if (state.chefCharges <= 0) {
      showToast('Сначала купи шеф-повара');
      return;
    }
    if (!unlockedIngredients().length) {
      showToast('Сначала открой хотя бы один ингредиент');
      return;
    }
    if (!els.editorModal.hidden) return;

    els.editorModal.hidden = false;
    els.editorClose.focus();

    renderEditorSide();

    window.requestAnimationFrame(() => {
      resizeEditor();
      resetRaceBoard();
      renderEditorSide();
    });
  }

  function closeEditor() {
    race.active = false;
    if (race.raf) cancelAnimationFrame(race.raf);
    race.raf = 0;
    els.editorModal.hidden = true;
    if (!els.editorBtn.hidden) els.editorBtn.focus();
  }

  function acceptRecipe() {
    if (!race.result || race.result.duplicate) return;

    const key = race.result.key;
    if (state.recipes.includes(key)) return;

    state.recipes.push(key);
    state.chefCharges = Math.max(0, state.chefCharges - 1);

    displayRecipeKey = key;
    lastRecipeSwap = performance.now();
    drawPizzaCanvas();
    popPizza();

    updateHud();
    renderStore();
    saveGame();
    showToast('Новый рецепт: ' + recipeName(key) + ' · повара ×' + formatNumber(cooksMultiplier()));
    closeEditor();
  }

  /* ---------- Recipe book ---------- */

  function renderBook() {
    const count = state.recipes.length;
    const multiplier = Math.pow(2, count);
    els.bookSummary.textContent = 'Рецептов: ' + count + ' / ' + maxRecipes()
      + ' · повара производят ×' + formatNumber(multiplier);
    els.bookGrid.innerHTML = '';

    if (!count) {
      const empty = document.createElement('div');
      empty.className = 'book-empty';
      empty.textContent = 'Пока пусто. Купи шеф-повара в магазине — он придумает первый рецепт в редакторе пиццы.';
      els.bookGrid.appendChild(empty);
      return;
    }

    for (const key of state.recipes) {
      const card = document.createElement('div');
      card.className = 'book-card';

      const art = document.createElement('span');
      art.className = 'book-pizza';
      const c = makeCanvas(38, 38);
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(getPizzaSprite(key), 0, 0, 38, 38);
      art.appendChild(c);

      const body = document.createElement('div');
      body.className = 'book-body';

      const name = document.createElement('div');
      name.className = 'book-name';
      name.textContent = recipeName(key);

      const ings = document.createElement('div');
      ings.className = 'book-ings';
      for (const id of key.split('+')) {
        const ic = makeCanvas(14, 14);
        const ig = ic.getContext('2d');
        ig.imageSmoothingEnabled = false;
        ig.drawImage(getIngredientIcon(id), 0, 0, 14, 14);
        ings.appendChild(ic);
      }

      const mult = document.createElement('div');
      mult.className = 'book-mult';
      mult.textContent = '×2 к производству поваров';

      body.appendChild(name);
      body.appendChild(ings);
      body.appendChild(mult);
      card.appendChild(art);
      card.appendChild(body);
      els.bookGrid.appendChild(card);
    }
  }

  function openBook() {
    renderBook();
    els.bookModal.hidden = false;
    els.bookClose.focus();
  }

  function closeBook() {
    els.bookModal.hidden = true;
    els.bookBtn.focus();
  }

  /* ---------- Pizza skins ---------- */

  let pendingSkin = 'classic';

  function skinById(id) {
    return PIZZA_SKINS[id] || PIZZA_SKINS.classic;
  }

  function paintSkinPreview(canvas, skinId) {
    if (!canvas) return;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(getPizzaSprite(displayRecipeKey, skinId), 0, 0, canvas.width, canvas.height);
  }

  function renderSkinRail() {
    els.skinRail.innerHTML = '';

    for (const id of SKIN_ORDER) {
      const skin = PIZZA_SKINS[id];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'skin-card';
      card.dataset.id = id;
      card.setAttribute('role', 'option');
      card.setAttribute('aria-label', skin.name);

      const thumb = document.createElement('span');
      thumb.className = 'skin-thumb';
      const art = makeCanvas(64, 64);
      paintSkinPreview(art, id);
      thumb.appendChild(art);

      const name = document.createElement('span');
      name.className = 'skin-card-name';
      name.textContent = skin.name;

      const status = document.createElement('span');
      status.className = 'skin-card-state';
      status.dataset.role = 'state';
      status.textContent = 'ПРИМЕРИТЬ';

      card.appendChild(thumb);
      card.appendChild(name);
      card.appendChild(status);
      els.skinRail.appendChild(card);
    }
  }

  function updateSkinSelection() {
    const skin = skinById(pendingSkin);
    const index = Math.max(0, SKIN_ORDER.indexOf(skin.id));
    const equipped = skin.id === state.skin;

    paintSkinPreview(els.skinPreview, skin.id);

    els.skinBadge.textContent = 'СКИН ' + (index + 1) + ' / ' + SKIN_ORDER.length;
    els.skinName.textContent = skin.name;
    els.skinTagline.textContent = skin.tagline;
    els.skinDough.textContent = skin.dough;
    els.skinMood.textContent = skin.mood;

    els.skinApply.textContent = equipped ? 'НАДЕТО' : 'НАДЕТЬ СКИН';
    els.skinApply.disabled = equipped;

    for (const card of els.skinRail.querySelectorAll('.skin-card')) {
      const active = card.dataset.id === skin.id;
      card.classList.toggle('active', active);
      card.setAttribute('aria-selected', active ? 'true' : 'false');
      const status = card.querySelector('[data-role="state"]');
      if (status) status.textContent = card.dataset.id === state.skin ? 'НАДЕТО' : 'ПРИМЕРИТЬ';
    }
  }

  function selectSkin(id, scroll) {
    if (!PIZZA_SKINS[id]) return;
    pendingSkin = id;
    updateSkinSelection();

    if (scroll) {
      const card = els.skinRail.querySelector('.skin-card[data-id="' + id + '"]');
      if (card) {
        card.scrollIntoView({
          block: 'nearest',
          inline: 'center',
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      }
    }
  }

  function cycleSkin(direction) {
    const index = SKIN_ORDER.indexOf(pendingSkin);
    const next = (index + direction + SKIN_ORDER.length) % SKIN_ORDER.length;
    selectSkin(SKIN_ORDER[next], true);
  }

  function openSkins() {
    if (!els.editorModal.hidden) closeEditor();
    if (!els.bookModal.hidden) closeBook();
    if (!els.ascendModal.hidden) closeAscend();
    if (!els.mozzModal.hidden) closeMozzarella();
    if (!els.miniModal.hidden) closeMinigame();
    if (els.marketModal && !els.marketModal.hidden) closeMarket();

    pendingSkin = state.skin;
    renderSkinRail();
    updateSkinSelection();
    els.skinModal.hidden = false;
    els.skinClose.focus();

    const active = els.skinRail.querySelector('.skin-card[data-id="' + pendingSkin + '"]');
    if (active) {
      active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
    }
  }

  function closeSkins() {
    els.skinModal.hidden = true;
    els.skinsBtn.focus();
  }

  function applySkin() {
    if (!PIZZA_SKINS[pendingSkin] || pendingSkin === state.skin) return;
    state.skin = pendingSkin;
    saveGame();
    drawPizzaCanvas();
    drawLogoIcon();
    updateSkinSelection();
    popPizza();
    showToast('Скин надет: ' + PIZZA_SKINS[state.skin].name);
  }

  let confirmAction = 'reset';
  let confirmReturnFocus = null;

  function openConfirm(action) {
    confirmAction = action === 'ascend' ? 'ascend' : 'reset';
    confirmReturnFocus = document.activeElement;

    if (confirmAction === 'ascend') {
      const gain = crustGain();
      els.confirmTitle.textContent = 'СОВЕРШИТЬ ВОСХОЖДЕНИЕ?';
      els.confirmText.textContent = 'Куски, постройки, прокачки и рецепты сбросятся. Вы получите '
        + formatNumber(gain) + ' ' + pluralCrustsAcc(gain) + '. Корочки и древо останутся.';
      els.confirmYes.textContent = 'ВОЗНЕСТИСЬ';
    } else {
      els.confirmTitle.textContent = 'НАЧАТЬ ЗАНОВО?';
      els.confirmText.textContent = 'Весь прогресс, рецепты, прокачки, корочки и древо будут потеряны.';
      els.confirmYes.textContent = 'СБРОСИТЬ';
    }

    els.confirmModal.hidden = false;
    els.confirmNo.focus();
  }

  function closeConfirm() {
    els.confirmModal.hidden = true;
    if (confirmReturnFocus && confirmReturnFocus.focus && !confirmReturnFocus.hidden) {
      confirmReturnFocus.focus();
    } else {
      els.resetBtn.focus();
    }
  }

  /* ---------- Events ---------- */

  let pressTimer = 0;

  function bindEvents() {
    els.pizzaWrap.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();

      els.pizzaWrap.classList.add('pressed');
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(() => els.pizzaWrap.classList.remove('pressed'), 95);

      const rect = els.pizzaWrap.getBoundingClientRect();
      const x = Number.isFinite(event.clientX) ? event.clientX : rect.left + rect.width / 2;
      const y = Number.isFinite(event.clientY) ? event.clientY : rect.top + rect.height / 2;
      clickPizza(x, y);
    });

    els.pizzaWrap.addEventListener('contextmenu', (event) => event.preventDefault());

    els.pizzaWrap.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const rect = els.pizzaWrap.getBoundingClientRect();
      clickPizza(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });

    els.store.addEventListener('click', (event) => {
      const card = event.target.closest('.card');
      if (!card) return;
      const kind = card.dataset.kind;
      const id = card.dataset.id;
      if (kind === 'event' && card.dataset.blocked === '1') {
        showToast('События доступны только в режиме покупки');
        return;
      }
      if (card.dataset.blocked === '1') {
        showToast('Прокачки нельзя продать');
        return;
      }
      if (kind === 'building') {
        if (storeMode === 'sell') sellBuilding(id, card);
        else buyBuilding(id, card);
      } else if (kind === 'upgrade') {
        buyUpgrade(id, card);
      } else if (kind === 'heavenly') {
        openAscend();
      } else if (kind === 'event') {
        if (id === 'cult') startCultEvent();
        else if (id === 'valorant') buyValorant(card);
      }
    });

    if (els.buyModeBtn) els.buyModeBtn.addEventListener('click', () => setStoreMode('buy'));
    if (els.sellModeBtn) els.sellModeBtn.addEventListener('click', () => setStoreMode('sell'));
    for (const btn of els.qtyBtns) {
      btn.addEventListener('click', () => setStoreQty(Number(btn.dataset.qty)));
    }

    els.treeBtn.addEventListener('click', openAscend);
    els.ascendClose.addEventListener('click', closeAscend);
    els.ascendModal.addEventListener('click', (event) => {
      if (event.target === els.ascendModal) closeAscend();
    });
    els.ascendBtn.addEventListener('click', () => openConfirm('ascend'));
    els.treeCanvas.addEventListener('click', (event) => {
      const node = event.target.closest('.tree-node');
      if (!node) return;
      buyHeavenly(node.dataset.id, node);
    });

    if (els.mozzBtn) els.mozzBtn.addEventListener('click', openMozzarella);
    if (els.mozzClose) els.mozzClose.addEventListener('click', closeMozzarella);
    if (els.mozzModal) {
      els.mozzModal.addEventListener('click', (event) => {
        if (event.target === els.mozzModal) closeMozzarella();
      });
    }
    if (els.mozzBuildings) {
      els.mozzBuildings.addEventListener('click', (event) => {
        const btn = event.target.closest('.mozz-btn');
        if (!btn || btn.disabled) return;
        if (btn.dataset.action === 'level') upgradeBuildingLevel(btn.dataset.id, btn);
        else openMinigame(btn.dataset.id);
      });
    }

    if (els.miniClose) els.miniClose.addEventListener('click', closeMinigame);
    if (els.miniModal) {
      els.miniModal.addEventListener('click', (event) => {
        if (event.target === els.miniModal) closeMinigame();
      });
    }

    if (els.marketClose) els.marketClose.addEventListener('click', closeMarket);
    if (els.marketModal) {
      els.marketModal.addEventListener('click', (event) => {
        if (event.target === els.marketModal) closeMarket();
      });
    }
    if (els.marketGrid) {
      els.marketGrid.addEventListener('click', (event) => {
        const btn = event.target.closest('.market-btn');
        if (!btn || btn.disabled) return;
        marketTrade(btn.dataset.id, btn.dataset.act, Number(btn.dataset.qty));
      });
    }

    if (els.eventStop) els.eventStop.addEventListener('click', () => endCultEvent(false));

    els.bookBtn.addEventListener('click', openBook);
    els.bookClose.addEventListener('click', closeBook);
    els.bookModal.addEventListener('click', (event) => {
      if (event.target === els.bookModal) closeBook();
    });

    if (els.skinsBtn) els.skinsBtn.addEventListener('click', openSkins);
    if (els.skinClose) els.skinClose.addEventListener('click', closeSkins);
    if (els.skinModal) {
      els.skinModal.addEventListener('click', (event) => {
        if (event.target === els.skinModal) closeSkins();
      });
    }
    if (els.skinPrev) els.skinPrev.addEventListener('click', () => cycleSkin(-1));
    if (els.skinNext) els.skinNext.addEventListener('click', () => cycleSkin(1));
    if (els.skinApply) els.skinApply.addEventListener('click', applySkin);
    if (els.skinRail) {
      els.skinRail.addEventListener('click', (event) => {
        const card = event.target.closest('.skin-card');
        if (!card) return;
        selectSkin(card.dataset.id, false);
      });
    }

    els.editorBtn.addEventListener('click', openEditor);
    els.editorClose.addEventListener('click', closeEditor);
    els.editorModal.addEventListener('click', (event) => {
      if (event.target === els.editorModal) closeEditor();
    });
    els.raceBtn.addEventListener('click', startRace);
    els.acceptBtn.addEventListener('click', acceptRecipe);

    els.resetBtn.addEventListener('click', openConfirm);
    els.confirmNo.addEventListener('click', closeConfirm);
    els.confirmYes.addEventListener('click', () => {
      if (confirmAction === 'ascend') {
        els.confirmModal.hidden = true;
        ascend();
        return;
      }
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (err) {
        /* ignore */
      }
      window.location.reload();
    });
    els.confirmModal.addEventListener('click', (event) => {
      if (event.target === els.confirmModal) closeConfirm();
    });

    document.addEventListener('keydown', (event) => {
      if (els.skinModal && !els.skinModal.hidden) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          cycleSkin(event.key === 'ArrowLeft' ? -1 : 1);
          return;
        }
      }

      if (event.key !== 'Escape') return;
      if (!els.confirmModal.hidden) {
        closeConfirm();
      } else if (els.skinModal && !els.skinModal.hidden) {
        closeSkins();
      } else if (els.eventLayer && !els.eventLayer.hidden) {
        endCultEvent(false);
      } else if (els.marketModal && !els.marketModal.hidden) {
        closeMarket();
      } else if (els.miniModal && !els.miniModal.hidden) {
        closeMinigame();
      } else if (els.mozzModal && !els.mozzModal.hidden) {
        closeMozzarella();
      } else if (!els.ascendModal.hidden) {
        closeAscend();
      } else if (!els.bookModal.hidden) {
        closeBook();
      } else if (!els.editorModal.hidden) {
        closeEditor();
      }
    });

    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      window.cancelAnimationFrame(resizeRaf);
      resizeRaf = window.requestAnimationFrame(() => {
        resize();
        if (!els.editorModal.hidden) {
          resizeEditor();
          resetRaceBoard();
          renderEditorSide();
        }
      });
    });

    document.addEventListener('visibilitychange', () => {
      lastFrame = performance.now();
      if (document.hidden) saveGame();
    });

    window.addEventListener('pagehide', saveGame);
  }

  /* ---------- Main loop / init ---------- */

  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.25);
    lastFrame = now;

    const gain = cps() * dt;
    if (gain > 0) {
      state.slices += gain;
      state.totalSlices += gain;
    }

    if (now - lastRecipeSwap > 14000 && state.recipes.length) {
      pickDisplayRecipe();
    }

    if (now - lastTextUpdate > 80) {
      lastTextUpdate = now;
      updateLiveText();
    }

    if (now - lastSignatureCheck > 300) {
      lastSignatureCheck = now;
      if (storeSignature() !== lastStoreSignature) renderStore();
    }

    if (now - lastSlowTick > 1000) {
      lastSlowTick = now;
      const stamp = Date.now();
      accrueMozzarella(stamp);
      pruneBuffs(stamp);
      tickMarket();
      updateEventsLive(stamp);
      updateMozzarellaHud(stamp);
      if (els.mozzModal && !els.mozzModal.hidden) updateMozzarellaLive(stamp);
      if (els.marketModal && !els.marketModal.hidden) updateMarketLive();
    }

    if (now - lastSave > 5000) {
      lastSave = now;
      saveGame();
    }

    renderScene(now);
    window.requestAnimationFrame(frame);
  }

  function init() {
    loadGame();

    plateSprite = createPlateSprite();
    plateShadowSprite = createPlateShadowSprite();

    getPizzaSprite('plain');
    getSliceSprites('plain');
    drawLogoIcon();
    drawCrustIcon();
    drawMozzarellaIcon();

    if (state.recipes.length) {
      displayRecipeKey = state.recipes[Math.floor(Math.random() * state.recipes.length)];
    } else {
      displayRecipeKey = 'plain';
    }

    syncUnlockNotified();
    accrueMozzarella(Date.now(), true);
    syncStoreToolbar();
    buildVisualSlices();
    renderStore();
    updateHud();
    resize();
    bindEvents();

    lastFrame = performance.now();
    lastRecipeSwap = performance.now();
    lastSave = performance.now();
    window.requestAnimationFrame(frame);
  }

  init();
})();
