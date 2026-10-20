/**
 * Made-up inventory for the public demo: a generic community-events storeroom.
 * Same physical layout as the real room (box wall, four filing cabinets, shelving),
 * but every name, item and person here is invented.
 */
import type { Activity, BoxStyle, Container, Item, Status } from "./types";

type BoxRow = [id: string, name: string, style: BoxStyle, gx: number, gy: number, gz: number];

const BOXES: BoxRow[] = [
  // front row
  ["box-popcorn-kit", "Popcorn Machine Kit", "black", 1, 1, 1],
  ["box-unsorted", "Unsorted Bits", "black", 1, 2, 1],
  ["box-food-containers", "Food Containers", "clear", 1, 3, 1],
  ["box-party-supplies", "Party Supplies", "clear", 2, 1, 1],
  ["box-board-games", "Board Games", "clear", 2, 2, 1],
  ["box-volunteer-vests", "Volunteer Vests", "clear", 2, 3, 1],
  ["box-spare-totes", "Spare Tote Bags", "bag", 4, 1, 1],
  ["box-pink-flowers", "Pink Flowers", "clear", 4, 2, 1],
  ["box-flags-bunting", "Flags & Bunting", "clear", 4, 3, 1],
  ["box-card-readers", "Card Readers", "grey", 4, 4, 1],
  // middle row
  ["box-costumes-props", "Costumes & Props", "black", 1, 1, 2],
  ["box-projector-screen", "Projector Screen", "black", 1, 2, 2],
  ["box-snack-cups", "Snack Cups & Boxes", "black", 1, 3, 2],
  ["box-table-runners", "Table Runners", "pink", 2, 1, 2],
  ["box-tablecloths-lights", "Tablecloths & Fairy Lights", "clear", 2, 2, 2],
  ["box-mugs-cups", "Mugs & Cups", "clear", 2, 3, 2],
  ["box-photo-frames", "Photo Frames", "clear", 2, 4, 2],
  ["box-tshirts-m", "T-Shirts – Medium", "cardboard", 3, 1, 2],
  ["box-tshirts-s", "T-Shirts – Small", "cardboard", 3, 2, 2],
  ["box-tote-bags", "Tote Bags", "cardboard", 3, 3, 2],
  // back row
  ["box-greenery-1", "Faux Greenery 1", "clear", 1, 1, 3],
  ["box-greenery-2", "Faux Greenery 2", "clear", 1, 2, 3],
  ["box-greenery-3", "Faux Greenery 3", "clear", 1, 3, 3],
  ["box-greenery-4", "Faux Greenery 4", "clear", 1, 4, 3],
  ["box-tablecloths", "Tablecloths", "clear", 2, 1, 3],
  ["box-craft-supplies", "Craft Supplies", "cardboard", 2, 2, 3],
  ["box-candles-1", "Candle Holders 1", "clear", 3, 1, 3],
  ["box-candles-2", "Candle Holders 2", "clear", 3, 2, 3],
  ["box-white-flowers", "White Flowers", "clear", 3, 3, 3],
  ["box-gift-bags", "Gift Bags", "cardboard", 3, 4, 3],
];

const DRAWERS: Record<string, string> = {
  "1.1": "Stationery",
  "1.2": "Merchandise",
  "1.3": "Name Badges",
  "1.4": "Spare Cables",
  "2.1": "First Aid",
  "2.2": "Batteries",
  "2.3": "Tools",
  "2.4": "Tape & Adhesives",
  "3.1": "Forms & Receipts",
  "3.2": "Signage",
  "3.3": "Lights",
  "3.4": "Extension Leads",
  "4.1": "Clipboards",
  "4.2": "Keys & Locks",
  "4.3": "Radios",
  "4.4": "Audio Kit",
};

type ItemRow = [container: string | null, name: string, category: string, qty: string | null, extra?: Partial<Item>];

const ITEMS: ItemRow[] = [
  // box wall
  ["box-popcorn-kit", "Popcorn machine", "CATERING", "1"],
  ["box-popcorn-kit", "Popcorn kernels (1 kg)", "CATERING", "4", { reorder: true }],
  ["box-popcorn-kit", "Popcorn scoops", "CATERING", "3"],
  ["box-unsorted", "Mixed odds and ends", "MISC", null, { notes: "Needs sorting at the next stocktake" }],
  ["box-food-containers", "Takeaway containers", "CATERING", "40+"],
  ["box-food-containers", "Paper cups (8 oz)", "CATERING", "150"],
  ["box-food-containers", "Plastic cup lids", "CATERING", "100+"],
  ["box-food-containers", "Wooden cutlery packs", "CATERING", "60"],
  ["box-party-supplies", "Balloons (assorted)", "DECOR", "50"],
  ["box-party-supplies", "Balloon pump", "DECOR", "2"],
  ["box-party-supplies", "Party poppers", "DECOR", "24"],
  ["box-party-supplies", "Streamers", "DECOR", "12"],
  ["box-party-supplies", "Glow sticks", "EVENTS", "30"],
  ["box-party-supplies", "Paper garlands", "DECOR", "4"],
  ["box-board-games", "Giant tumbling tower", "EVENTS", "1"],
  ["box-board-games", "Card games", "EVENTS", "6"],
  ["box-board-games", "Giant dice", "EVENTS", "2"],
  ["box-volunteer-vests", "Hi-vis volunteer vests", "SAFETY", "24", { notes: "6× M, 10× L, 8× XL" }],
  ["box-spare-totes", "Canvas tote bags (spare)", "MERCH", "35"],
  ["box-pink-flowers", "Pink artificial flowers", "DECOR", "15+"],
  ["box-pink-flowers", "Ivy garland", "DECOR", "2"],
  ["box-flags-bunting", "Bunting (rainbow)", "DECOR", "3"],
  ["box-flags-bunting", "Mini hand flags", "DECOR", "20"],
  ["box-flags-bunting", "Table flags with stands", "DECOR", "8"],
  ["box-card-readers", "Card payment readers", "TECH", "2"],
  ["box-card-readers", "Reader charging cables", "TECH", "3"],
  ["box-card-readers", "Receipt paper rolls", "OFFICE", "12"],
  ["box-card-readers", "Tablet stands", "TECH", "2"],
  ["box-costumes-props", "Mascot costume", "EVENTS", "1"],
  ["box-costumes-props", "Photo booth props", "EVENTS", "25"],
  ["box-costumes-props", "Bubble wands", "EVENTS", "18"],
  ["box-projector-screen", "Pop-up projector screen", "AV", "1"],
  ["box-projector-screen", "Screen carry bag", "AV", "1"],
  ["box-snack-cups", "Popcorn boxes", "CATERING", "200"],
  ["box-snack-cups", "Snack cones", "CATERING", "400"],
  ["box-table-runners", "Satin table runners (navy)", "DECOR", "30"],
  ["box-table-runners", "Hessian table runners", "DECOR", "8"],
  ["box-tablecloths-lights", "White disposable tablecloths", "DECOR", "10"],
  ["box-tablecloths-lights", "Battery tea lights", "DECOR", "40"],
  ["box-tablecloths-lights", "Fairy lights (cool white)", "DECOR", "4"],
  ["box-mugs-cups", "Ceramic mugs", "CATERING", "24", { condition: "2 chipped" }],
  ["box-photo-frames", "A4 black frames", "DECOR", "6"],
  ["box-photo-frames", "6×8 white frames", "DECOR", "4"],
  ["box-tshirts-m", "Event T-shirts (M)", "MERCH", "14"],
  ["box-tshirts-s", "Event T-shirts (S)", "MERCH", "11"],
  ["box-tote-bags", "Printed tote bags", "MERCH", "120"],
  ["box-greenery-1", "Eucalyptus stems", "DECOR", "20+"],
  ["box-greenery-2", "Fern bunches", "DECOR", "12"],
  ["box-greenery-3", "Olive branches", "DECOR", "10"],
  ["box-greenery-4", "Mini potted succulents", "DECOR", "16"],
  ["box-tablecloths", "Round white tablecloths", "DECOR", "6"],
  ["box-tablecloths", "Black rectangular tablecloths", "DECOR", "4"],
  ["box-craft-supplies", "Paint brushes", "CRAFT", "20"],
  ["box-craft-supplies", "Chalk", "CRAFT", "30"],
  ["box-craft-supplies", "Paint-by-numbers canvases", "CRAFT", "10"],
  ["box-craft-supplies", "Glue sticks", "CRAFT", "15", { reorder: true }],
  ["box-candles-1", "LED pillar candles", "DECOR", "16"],
  ["box-candles-1", "Hanging lanterns", "DECOR", "12"],
  ["box-candles-2", "Glass candle holders (10 cm)", "DECOR", "8"],
  ["box-candles-2", "Gold candle holders", "DECOR", "24"],
  ["box-white-flowers", "White orchid stems", "DECOR", "20+"],
  ["box-gift-bags", "Thank-you gift bags", "EVENTS", "15"],
  ["box-gift-bags", "Insulated water bottles", "MERCH", "6"],

  // filing cabinets
  ["drawer-1-1", "Marker pens", "OFFICE", "24"],
  ["drawer-1-1", "Sticky notes", "OFFICE", "12"],
  ["drawer-1-1", "Scissors", "OFFICE", "5"],
  ["drawer-1-2", "Branded pens", "MERCH", "100+"],
  ["drawer-1-2", "Keyrings", "MERCH", "40"],
  ["drawer-1-2", "Stickers", "MERCH", "200+"],
  ["drawer-1-3", "Lanyards", "EVENTS", "60"],
  ["drawer-1-3", "Badge holders", "EVENTS", "60"],
  ["drawer-1-4", "HDMI cables", "TECH", "4"],
  ["drawer-1-4", "USB-C cables", "TECH", "6"],
  ["drawer-1-4", "Phone chargers", "TECH", "3"],
  ["drawer-2-1", "First aid kit", "SAFETY", "2"],
  ["drawer-2-1", "Instant ice packs", "SAFETY", "10"],
  ["drawer-2-2", "AA batteries", "TECH", "16", { reorder: true }],
  ["drawer-2-2", "AAA batteries", "TECH", "24"],
  ["drawer-2-3", "Screwdriver set", "TECH", "1"],
  ["drawer-2-3", "Cable ties", "TECH", "100"],
  ["drawer-2-3", "Tape measure", "TECH", "1"],
  ["drawer-2-4", "Gaffer tape", "TECH", "2", { reorder: true }],
  ["drawer-2-4", "Blu-tack", "OFFICE", "6"],
  ["drawer-2-4", "Double-sided tape", "OFFICE", "4"],
  ["drawer-3-1", "Event sign-in sheets", "OFFICE", "1 pad"],
  ["drawer-3-1", "Raffle tickets", "EVENTS", "500"],
  ["drawer-3-2", "A-frame sign inserts", "SIGNAGE", "6"],
  ["drawer-3-2", "Table number cards", "SIGNAGE", "20"],
  ["drawer-3-3", "Fairy lights (warm white)", "DECOR", "6", { status: "Partly taken", taken_by: "Sam" }],
  ["drawer-3-3", "LED uplights", "AV", "4"],
  ["drawer-3-3", "Light remotes", "AV", "4"],
  ["drawer-3-4", "4-socket extension leads", "TECH", "5"],
  ["drawer-3-4", "Power boards", "TECH", "3"],
  ["drawer-4-1", "Clipboards", "OFFICE", "9"],
  ["drawer-4-2", "Padlocks", "OFFICE", "3"],
  ["drawer-4-2", "Spare keys (labelled)", "OFFICE", "1 set"],
  ["drawer-4-3", "Two-way radio set A", "TECH", "4", { status: "Taken", taken_by: "Priya", notes: "2 radios, charger, 2 earpieces" }],
  ["drawer-4-3", "Two-way radio set B", "TECH", "4", { notes: "2 radios, charger, 2 earpieces" }],
  ["drawer-4-3", "Radio earpieces (spare)", "TECH", "6"],
  ["drawer-4-4", "Wireless microphones", "AV", "2"],
  ["drawer-4-4", "Laser pointer", "AV", "1", { status: "Missing", notes: "Last seen at the spring showcase" }],
  ["drawer-4-4", "Podcast mic stands", "AV", "2"],
  ["top-tickets", "Event tickets", "EVENTS", "200+"],
  ["top-tickets", "Wristbands", "EVENTS", "100"],
  ["top-stamps", "Ink stamps", "OFFICE", "6"],

  // shelving
  ["shelf-1", "Pull-up banners", "SIGNAGE", "3"],
  ["shelf-1", "Event posters (rolled)", "SIGNAGE", "12"],
  ["shelf-1", "Backdrop frame", "EVENTS", "1"],
  ["shelf-2", "Light stands", "AV", "4"],
  ["shelf-2", "Podcast kit", "AV", "2", { spot: "Mics are in the Audio Kit drawer (4.4)" }],
  ["shelf-2", "Feather flag poles", "SIGNAGE", "4"],
  ["shelf-3", "Multimedia projector", "AV", "1"],
  ["shelf-3", "25 m extension reel", "TECH", "2"],
  ["shelf-3", "Drinks cooler", "CATERING", "1"],
  ["shelf-4", "Duffel bags", "EVENTS", "3"],
  ["shelf-4", "Picnic rugs", "EVENTS", "4"],
  ["shelf-unknown", "USB-A to micro-USB cables", "TECH", "9"],
  ["shelf-unknown", "Spare banner bases", "SIGNAGE", "2"],

  // floor
  ["floor-front", "Wooden easels", "EVENTS", "3", { status: "Partly taken", taken_by: "Alex (open day)" }],
  ["floor-front", "Welcome sign board", "SIGNAGE", "1"],
  ["floor-back-left", "Banner poles", "SIGNAGE", "6"],

  // outside the storeroom
  ["ext-office-a", "Paper plates", "CATERING", "50"],
  ["ext-office-a", "Napkins", "CATERING", "200"],
  ["ext-office-a", "Wooden tongs", "CATERING", "4"],
  ["ext-office-b", "Tea bags", "CATERING", "80"],
  ["ext-office-b", "Coffee stirrers", "CATERING", "250"],
  ["ext-office-b", "Sugar sticks", "CATERING", "100", { spot: "Basket, top shelf" }],
  ["ext-reception", "Visitor lanyards", "EVENTS", "30"],

  // in the room, spot not recorded
  [null, "Cutting machine", "CRAFT", "1"],
  [null, "Portable speaker", "AV", "1"],
  [null, "Small cool box", "CATERING", "1"],
];

const ago = (now: number, hours: number) => new Date(now - hours * 3_600_000).toISOString();

function container(c: Partial<Container> & Pick<Container, "id" | "kind" | "name">, now: number): Container {
  return { style: null, gx: null, gy: null, gz: null, place: null, status: "Available", taken_by: null, notes: null, updated_at: ago(now, 240), ...c };
}

export function buildDemoData(now = Date.now()): { containers: Container[]; items: Item[]; activity: Activity[] } {
  const containers: Container[] = [
    ...BOXES.map(([id, name, style, gx, gy, gz]) => container({ id, kind: "box", name, style, gx, gy, gz }, now)),
    ...Object.entries(DRAWERS).map(([code, name]) => {
      const [gx, gy] = code.split(".").map(Number);
      return container({ id: `drawer-${gx}-${gy}`, kind: "drawer", name, gx, gy }, now);
    }),
    ...([
      [1, "Top shelf"],
      [2, "Shelf 2"],
      [3, "Shelf 3"],
      [4, "Bottom shelf"],
    ] as const).map(([gy, name]) => container({ id: `shelf-${gy}`, kind: "shelf", name, gy }, now)),
    container({ id: "shelf-unknown", kind: "shelf", name: "Shelving (level not recorded)" }, now),
    container({ id: "top-tickets", kind: "top", name: "Ticket box", style: "clear", gx: 3, gy: 1 }, now),
    container({ id: "top-stamps", kind: "top", name: "Stamps container", style: "clear", gx: 3, gy: 2 }, now),
    container({ id: "floor-front", kind: "floor", name: "By the door", gx: 1 }, now),
    container({ id: "floor-back-left", kind: "floor", name: "Back-left corner", gx: 2 }, now),
    container({ id: "ext-office-a", kind: "external", name: "Cabinet A", place: "Main Office" }, now),
    container({ id: "ext-office-b", kind: "external", name: "Cabinet B", place: "Main Office" }, now),
    container({ id: "ext-reception", kind: "external", name: "Store Cupboard", place: "Reception" }, now),
  ];
  // The projector screen box is out for a film night.
  Object.assign(containers.find((c) => c.id === "box-projector-screen")!, {
    status: "Taken" as Status,
    taken_by: "Jordan (film night)",
    updated_at: ago(now, 50),
  });

  const items: Item[] = ITEMS.map(([container_id, name, category, quantity, extra], i) => ({
    id: `demo-${String(i + 1).padStart(3, "0")}`,
    name,
    category,
    quantity,
    container_id,
    spot: null,
    status: "Available",
    taken_by: null,
    condition: null,
    notes: null,
    reorder: false,
    updated_at: ago(now, 240),
    ...extra,
  }));

  const activity: Activity[] = [
    { id: 6, at: ago(now, 3), actor: "Alex", action: "item.update", summary: "“Wooden easels”: marked Partly taken by Alex (open day)" },
    { id: 5, at: ago(now, 6), actor: "Sam", action: "item.update", summary: "“Fairy lights (warm white)”: marked Partly taken by Sam" },
    { id: 4, at: ago(now, 27), actor: "Priya", action: "item.update", summary: "“Two-way radio set A”: marked Taken by Priya" },
    { id: 3, at: ago(now, 50), actor: "Jordan", action: "container.update", summary: "“Projector Screen”: marked Taken by Jordan (film night)" },
    { id: 2, at: ago(now, 76), actor: "Morgan", action: "item.update", summary: "“Laser pointer”: marked Missing" },
    {
      id: 1,
      at: ago(now, 240),
      actor: null,
      action: "seed",
      summary: `Imported ${items.length} items and ${containers.length} storage spots from the stocktake spreadsheet`,
    },
  ];
  return { containers, items, activity };
}
