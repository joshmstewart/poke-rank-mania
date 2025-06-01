import { PokemonFormType } from "./types";

export const detectRegionalForms = (name: string): boolean => {
  return name.includes('-alolan') || name.includes('-galarian') || name.includes('-hisuian') || name.includes('-paldean') ||
         name.includes('-alola') || name.includes('-galar') || name.includes('-hisui') || name.includes('-paldea');
};

export const detectMegaGmaxForms = (name: string): boolean => {
  return name.includes('-mega') || name.includes('-gmax') || name.includes('-gigantamax');
};

export const detectOriginPrimalForms = (name: string): boolean => {
  return name.includes('-origin') || name.includes('-primal');
};

export const detectGenderForms = (name: string): boolean => {
  return name.includes('-male') || name.includes('-female') || name.includes('-m') || name.includes('-f') ||
         name === 'nidoran-f' || name === 'nidoran-m' || // Special cases
         name.includes('♂') || name.includes('♀');
};

export const detectCostumeForms = (name: string): boolean => {
  return (name.includes('pikachu') && (name.includes('-cap') || name.includes('-hat') || name.includes('-costume') ||
         name.includes('-libre') || name.includes('-phd') || name.includes('-pop-star') || name.includes('-rock-star') ||
         name.includes('-belle') || name.includes('-cosplay') || name.includes('-original') || name.includes('-hoenn') ||
         name.includes('-sinnoh') || name.includes('-unova') || name.includes('-kalos') || name.includes('-alola') ||
         name.includes('-partner') || name.includes('-world') || name.includes('-ash'))) ||
         // Other specific costume cases
         name.includes('-costume') || name.includes('-hat');
};

export const detectColorFlavorForms = (name: string): boolean => {
  return (
    // Oricorio forms
    (name.includes('oricorio') && (name.includes('-baile') || name.includes('-pom-pom') || name.includes('-pau') || name.includes('-sensu'))) ||
    // Basculin forms  
    (name.includes('basculin') && (name.includes('-red-striped') || name.includes('-blue-striped'))) ||
    // Toxtricity forms
    (name.includes('toxtricity') && (name.includes('-amped') || name.includes('-low-key'))) ||
    // Urshifu forms
    (name.includes('urshifu') && (name.includes('-single-strike') || name.includes('-rapid-strike'))) ||
    // Kyurem forms
    (name.includes('kyurem') && (name.includes('-black') || name.includes('-white'))) ||
    // Squawkabilly forms
    (name.includes('squawkabilly') && name.includes('-plumage')) ||
    // Minior core colors (not meteor forms which are excluded)
    (name.includes('minior') && !name.includes('meteor') && 
     (name.includes('-red') || name.includes('-orange') || name.includes('-yellow') || 
      name.includes('-green') || name.includes('-blue') || name.includes('-indigo') || name.includes('-violet')))
  );
};

export const detectSpecialForms = (name: string): boolean => {
  return (
    // Rotom forms
    (name.includes('rotom') && (name.includes('-heat') || name.includes('-wash') || name.includes('-frost') || 
     name.includes('-fan') || name.includes('-mow'))) ||
    // Shaymin forms
    (name.includes('shaymin') && name.includes('-sky')) ||
    // Giratina forms
    (name.includes('giratina') && (name.includes('-altered') || name.includes('-origin'))) ||
    // Deoxys forms
    (name.includes('deoxys') && (name.includes('-normal') || name.includes('-attack') || name.includes('-defense') || name.includes('-speed'))) ||
    // Wormadam forms
    (name.includes('wormadam') && (name.includes('-plant') || name.includes('-sandy') || name.includes('-trash'))) ||
    // Castform forms
    (name.includes('castform') && (name.includes('-sunny') || name.includes('-rainy') || name.includes('-snowy'))) ||
    // Cherrim forms
    (name.includes('cherrim') && name.includes('-sunshine')) ||
    // Arceus forms (with plate types)
    (name.includes('arceus') && name.includes('-')) ||
    // Other specific form indicators
    name.includes('-blade') || name.includes('-shield') || name.includes('-confined') || name.includes('-unbound') ||
    name.includes('-complete') || name.includes('-crowned') || name.includes('-eternamax') ||
    name.includes('-dusk') || name.includes('-dawn') || name.includes('-ultra') || name.includes('-zen') ||
    name.includes('-therian') || name.includes('-incarnate') || name.includes('-aria') || name.includes('-pirouette') ||
    name.includes('-ordinary') || name.includes('-resolute') || name.includes('-solo') || name.includes('-school') ||
    name.includes('-disguised') || name.includes('-busted')
  );
};

export const categorizeFormType = (name: string): PokemonFormType | null => {
  if (detectRegionalForms(name)) return 'regional';
  if (detectMegaGmaxForms(name)) return 'megaGmax';
  if (detectOriginPrimalForms(name)) return 'originPrimal';
  if (detectGenderForms(name)) return 'gender';
  if (detectCostumeForms(name)) return 'costumes';
  if (detectColorFlavorForms(name)) return 'colorsFlavors';
  if (detectSpecialForms(name)) return 'forms';
  
  return 'normal';
};
