/**
 * Initial roster — imported once per fresh database via the in-app "Seed Roster"
 * button on the Admin page. After that, all data lives in Supabase.
 */
import type { Member } from './types';

type SeedMember = Omit<Member, 'id' | 'claimed_by' | 'attending_event'>;

export const SEED_MEMBERS: SeedMember[] = [
  // House Du Hyre
  { house_id: 'du-hyre', name: 'Talos', player_name: 'Gaz Prior', pid: null, rank: 'Earl (King Cuck)', function: 'Leadership', military_function: 'Ambi', is_noble: true, status: 'active', hp: 10, mp: null, resource: 'Military Unit', coin_per_event: '4 crowns', coven: null, notes: null },
  { house_id: 'du-hyre', name: 'Constance', player_name: 'Tam Chokorova', pid: null, rank: 'Noble', function: '2nd Claws', military_function: 'Ambi', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'du-hyre', name: 'Lucius of the Shadows', player_name: 'Scott Lewis', pid: null, rank: 'Chief Spymaster', function: '2nd Claws', military_function: 'Ambi', is_noble: false, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'du-hyre', name: 'Emerys', player_name: 'Josh Riley', pid: null, rank: 'Noble', function: '2nd Claws', military_function: 'Great Sword', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Farm', coin_per_event: null, coven: null, notes: null },
  { house_id: 'du-hyre', name: 'Butcher', player_name: 'Rob Gear', pid: null, rank: '3rd Claw Commander', function: '3rd Claws', military_function: 'Physik', is_noble: false, status: 'active', hp: null, mp: null, resource: 'Herb Garden', coin_per_event: null, coven: null, notes: null },
  { house_id: 'du-hyre', name: 'Lotara Claw', player_name: 'Angel Morgan-Valentine', pid: null, rank: 'Queen', function: 'Leadership', military_function: null, is_noble: true, status: 'active', hp: null, mp: null, resource: null, coin_per_event: null, coven: null, notes: null },
  { house_id: 'du-hyre', name: 'Renoir De Sardet', player_name: 'Kyle Parker', pid: '11313', rank: 'Noble', function: '2nd Claws', military_function: 'Battle Mage', is_noble: true, status: 'active', hp: 4, mp: 4, resource: 'Mana Site', coin_per_event: '18 r', coven: 'mournival', notes: null },

  // House Serrated Suns
  { house_id: 'serrated-suns', name: 'Argal Tal', player_name: 'Dave Roth', pid: '15833', rank: 'Earl (First Captain)', function: 'Leadership', military_function: 'Ambi', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: '4 crowns', coven: null, notes: null },
  { house_id: 'serrated-suns', name: 'Lucien Ventris', player_name: 'Ash Collins', pid: null, rank: 'Mournival Coven Leader', function: '2nd Claws', military_function: 'Battle Mage', is_noble: true, status: 'active', hp: 4, mp: 4, resource: 'Mana Site', coin_per_event: '18 r', coven: 'mournival', notes: null },
  { house_id: 'serrated-suns', name: 'Evoo', player_name: 'Alice Foster', pid: '17030', rank: 'Bread Knight', function: '2nd Claws', military_function: 'Archer', is_noble: true, status: 'active', hp: 2, mp: null, resource: 'Military Unit', coin_per_event: '18 r', coven: null, notes: null },
  { house_id: 'serrated-suns', name: 'Aurelian', player_name: 'Callum Meiklam', pid: null, rank: 'Member', function: '1st Claws', military_function: 'Shield Wall', is_noble: false, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'serrated-suns', name: 'Lord Executioner', player_name: 'Fabs', pid: null, rank: 'Lord Executioner', function: '1st Claws', military_function: 'Shield Wall', is_noble: false, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'serrated-suns', name: 'Vulkan Pendragon', player_name: 'Tom Maden', pid: null, rank: 'Pyreguard Captain (TBE)', function: '1st Claws', military_function: 'Shield Wall/Halberd/Rearguard', is_noble: true, status: 'active', hp: 8, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'serrated-suns', name: 'Jasper Ravenscroft', player_name: 'John', pid: null, rank: 'Member', function: '2nd Claws', military_function: 'Ambi', is_noble: false, status: 'active', hp: null, mp: null, resource: null, coin_per_event: null, coven: null, notes: null },
  { house_id: 'serrated-suns', name: 'Bastien du Roc', player_name: 'Patrick', pid: null, rank: 'Member', function: '3rd Claws', military_function: 'Artisan', is_noble: false, status: 'active', hp: null, mp: null, resource: null, coin_per_event: null, coven: null, notes: null },
  { house_id: 'serrated-suns', name: 'Eira', player_name: 'Sam Dunn', pid: null, rank: 'Member', function: '3rd Claws', military_function: 'Healer Mage', is_noble: false, status: 'active', hp: null, mp: null, resource: null, coin_per_event: null, coven: 'mournival', notes: null },
  { house_id: 'serrated-suns', name: 'Jacques', player_name: 'Xander', pid: null, rank: 'Noble', function: '3rd Claws', military_function: 'Physick', is_noble: true, status: 'active', hp: 6, mp: null, resource: 'Herb Garden', coin_per_event: '18 r', coven: null, notes: null },
  { house_id: 'serrated-suns', name: 'Ares', player_name: 'Phil', pid: '18380', rank: 'Noble', function: null, military_function: 'Great Sword', is_noble: true, status: 'active', hp: 5, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'serrated-suns', name: 'Sylvara Valencourt', player_name: 'Freya Woodley', pid: '18428', rank: 'Noble', function: null, military_function: 'Archer/Katana', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },

  // House De La Montagne
  { house_id: 'de-la-montagne', name: 'Viktor Montagne', player_name: 'Alfie Lethbridge', pid: '16593', rank: 'Earl / 1st Claw Commander', function: '1st Claws', military_function: 'Shield Wall', is_noble: true, status: 'active', hp: 7, mp: null, resource: 'Military Unit', coin_per_event: '18 r +', coven: null, notes: null },
  { house_id: 'de-la-montagne', name: 'Nix Niadara', player_name: 'Heidi Collins', pid: null, rank: 'Noble', function: '2nd Claws', military_function: 'Battle Mage', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Mana Site', coin_per_event: '18 r', coven: 'mournival', notes: null },
  { house_id: 'de-la-montagne', name: 'Ælfric', player_name: 'Lewis Hinchcliffe', pid: '15613', rank: 'Yeofolk', function: '1st Claws', military_function: 'Shield Wall', is_noble: false, status: 'active', hp: 7, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'de-la-montagne', name: 'Garro', player_name: 'Jamie', pid: null, rank: '2nd Claw Leader', function: '2nd Claws', military_function: 'Pole Arm', is_noble: false, status: 'active', hp: null, mp: null, resource: null, coin_per_event: null, coven: null, notes: null },
  { house_id: 'de-la-montagne', name: 'Klaus', player_name: 'Angelo Waldin-Deaves', pid: '17061', rank: 'Man at Arms / Independent Contractor', function: '2nd Claws', military_function: 'Halberdier', is_noble: false, status: 'active', hp: 8, mp: null, resource: 'Military Unit', coin_per_event: 'Redacted', coven: null, notes: null },
  { house_id: 'de-la-montagne', name: 'Lewis O', player_name: 'Lewis Oaten', pid: null, rank: 'Noble', function: '1st Claws', military_function: 'Shield Wall', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'de-la-montagne', name: 'Kingsley', player_name: 'James Strickley', pid: null, rank: 'Member', function: '2nd Claws', military_function: 'Battle Mage', is_noble: false, status: 'active', hp: null, mp: null, resource: null, coin_per_event: null, coven: null, notes: null },
  { house_id: 'de-la-montagne', name: 'Grimfold Vanderblast', player_name: 'Andy Shepherd-Waring', pid: null, rank: 'Noble', function: '2nd Claws', military_function: 'Battle Mage', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: 'mournival', notes: null },
  { house_id: 'de-la-montagne', name: 'Lucille Mazet', player_name: 'Shell Martin', pid: '18318', rank: 'Noble', function: '3rd Claws', military_function: 'Healer Mage', is_noble: true, status: 'active', hp: 2, mp: 8, resource: 'Mana Site', coin_per_event: '18 r', coven: null, notes: null },
  { house_id: 'de-la-montagne', name: 'Tris Oaten', player_name: 'Tris Oaten', pid: null, rank: 'Noble', function: 'Non-combatant', military_function: null, is_noble: true, status: 'active', hp: null, mp: null, resource: null, coin_per_event: null, coven: null, notes: null },
  { house_id: 'de-la-montagne', name: 'Keres', player_name: 'Chloe Lister', pid: null, rank: 'Noble', function: null, military_function: 'Battle Mage', is_noble: true, status: 'active', hp: 4, mp: 6, resource: 'Mana Site', coin_per_event: '18 r', coven: 'mournival', notes: null },

  // House Maddox
  { house_id: 'maddox', name: 'Earl Maddox', player_name: null, pid: null, rank: 'Earl', function: '3rd Claws', military_function: null, is_noble: true, status: 'active', hp: null, mp: null, resource: null, coin_per_event: null, coven: null, notes: null },
  { house_id: 'maddox', name: 'Frederuna Maddox', player_name: 'Jessica Barnes', pid: '15815', rank: 'Lady', function: 'Non-combatant', military_function: 'Ritual Mage', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Mana Site', coin_per_event: null, coven: 'golden-grove', notes: null },
  { house_id: 'maddox', name: 'Edvard', player_name: 'Mark Drakeford', pid: null, rank: 'Member', function: '1st Claws', military_function: 'Shield Wall', is_noble: false, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'maddox', name: 'Alfred', player_name: 'Tom Jaggs', pid: null, rank: 'Yeofolk', function: '1st Claws', military_function: 'Shield Wall', is_noble: false, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: 'maddox', name: 'Ruskin Maddox', player_name: 'Duncan Christie', pid: '15814', rank: 'Flaming Claw', function: '3rd Claws', military_function: 'Healer Mage', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: 'golden-grove', notes: null },

  // House Vortekar
  { house_id: 'vortekar', name: 'Ser Vicente Vortekar', player_name: 'Eric', pid: null, rank: 'Knight Errant', function: null, military_function: 'Crossbowman/Physick', is_noble: false, status: 'active', hp: 5, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },

  // Unassigned (house_id null)
  { house_id: null, name: 'Pip Ash', player_name: 'Pip Ash', pid: null, rank: 'Noble', function: '1st Claws', military_function: 'Shield Wall', is_noble: true, status: 'active', hp: null, mp: null, resource: 'Military Unit', coin_per_event: null, coven: null, notes: null },
  { house_id: null, name: 'William', player_name: 'Liam Spencer', pid: null, rank: 'Member', function: '2nd Claws', military_function: 'Great Sword', is_noble: false, status: 'active', hp: null, mp: null, resource: null, coin_per_event: null, coven: null, notes: null },
  { house_id: null, name: 'Merron', player_name: 'Thomas Lomax', pid: null, rank: 'Yeofolk', function: '2nd Claws', military_function: 'Miscellaneous Mage', is_noble: false, status: 'active', hp: 4, mp: 4, resource: 'Mana Crystals', coin_per_event: null, coven: null, notes: null }
];
