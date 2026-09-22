// Common passenger-car makes and models in India. Admins can enter an unlisted make or model.
export const vehicleCatalog: Record<string, Record<string, string>> = {
  'Audi': { 'A3': 'Sedan', 'A4': 'Sedan', 'A6': 'Sedan', 'Q3': 'SUV', 'Q5': 'SUV', 'Q7': 'SUV', 'e-tron': 'SUV' },
  'BMW': { '2 Series': 'Sedan', '3 Series': 'Sedan', '5 Series': 'Sedan', 'X1': 'SUV', 'X3': 'SUV', 'X5': 'SUV', 'iX': 'SUV' },
  'BYD': { 'Atto 3': 'SUV', 'Seal': 'Sedan', 'eMAX 7': 'MPV' },
  'Citroen': { 'C3': 'Hatchback', 'C3 Aircross': 'SUV', 'Basalt': 'SUV' },
  'Datsun': { 'redi-GO': 'Hatchback', 'GO': 'Hatchback', 'GO+': 'MPV' },
  'Fiat': { 'Punto': 'Hatchback', 'Linea': 'Sedan', 'Avventura': 'Hatchback' },
  'Force': { 'Gurkha': 'SUV', 'Trax': 'MPV' },
  'Ford': { 'Figo': 'Hatchback', 'Aspire': 'Sedan', 'EcoSport': 'SUV', 'Endeavour': 'SUV', 'Freestyle': 'Hatchback' },
  'Honda': { 'Amaze': 'Sedan', 'City': 'Sedan', 'Civic': 'Sedan', 'Jazz': 'Hatchback', 'WR-V': 'SUV', 'Elevate': 'SUV', 'BR-V': 'SUV', 'CR-V': 'SUV' },
  'Hyundai': { 'Grand i10 Nios': 'Hatchback', 'i10': 'Hatchback', 'i20': 'Hatchback', 'Aura': 'Sedan', 'Verna': 'Sedan', 'Creta': 'SUV', 'Venue': 'SUV', 'Exter': 'SUV', 'Alcazar': 'SUV', 'Tucson': 'SUV', 'Kona Electric': 'SUV', 'IONIQ 5': 'SUV' },
  'Isuzu': { 'D-Max': 'Pickup', 'V-Cross': 'Pickup', 'MU-X': 'SUV' },
  'Jaguar': { 'XE': 'Sedan', 'XF': 'Sedan', 'F-Pace': 'SUV', 'I-Pace': 'SUV' },
  'Jeep': { 'Compass': 'SUV', 'Meridian': 'SUV', 'Wrangler': 'SUV', 'Grand Cherokee': 'SUV' },
  'Kia': { 'Sonet': 'SUV', 'Seltos': 'SUV', 'Carens': 'MPV', 'Carnival': 'MPV', 'EV6': 'SUV', 'Syros': 'SUV' },
  'Land Rover': { 'Defender': 'SUV', 'Discovery': 'SUV', 'Range Rover Evoque': 'SUV', 'Range Rover Sport': 'SUV' },
  'Lexus': { 'ES': 'Sedan', 'NX': 'SUV', 'RX': 'SUV', 'LX': 'SUV' },
  'Mahindra': { 'Bolero': 'SUV', 'Bolero Neo': 'SUV', 'Scorpio': 'SUV', 'Scorpio N': 'SUV', 'Thar': 'SUV', 'XUV300': 'SUV', 'XUV3XO': 'SUV', 'XUV500': 'SUV', 'XUV700': 'SUV', 'Marazzo': 'MPV', 'XUV400': 'SUV', 'BE 6': 'SUV', 'XEV 9e': 'SUV' },
  'Maserati': { 'Ghibli': 'Sedan', 'Levante': 'SUV', 'Grecale': 'SUV' },
  'Maruti Suzuki': { 'Alto': 'Hatchback', 'Alto K10': 'Hatchback', 'S-Presso': 'Hatchback', 'Celerio': 'Hatchback', 'Wagon R': 'Hatchback', 'Swift': 'Hatchback', 'Baleno': 'Hatchback', 'Ignis': 'Hatchback', 'Dzire': 'Sedan', 'Ciaz': 'Sedan', 'Brezza': 'SUV', 'Fronx': 'SUV', 'Grand Vitara': 'SUV', 'Jimny': 'SUV', 'Ertiga': 'MPV', 'XL6': 'MPV', 'Invicto': 'MPV' },
  'Mercedes-Benz': { 'A-Class': 'Sedan', 'C-Class': 'Sedan', 'E-Class': 'Sedan', 'S-Class': 'Sedan', 'GLA': 'SUV', 'GLC': 'SUV', 'GLE': 'SUV', 'GLS': 'SUV', 'EQB': 'SUV' },
  'MG': { 'Comet EV': 'Hatchback', 'Astor': 'SUV', 'Hector': 'SUV', 'Hector Plus': 'SUV', 'ZS EV': 'SUV', 'Gloster': 'SUV', 'Windsor EV': 'SUV' },
  'Mini': { 'Cooper': 'Hatchback', 'Countryman': 'SUV' },
  'Nissan': { 'Micra': 'Hatchback', 'Sunny': 'Sedan', 'Magnite': 'SUV', 'Kicks': 'SUV', 'X-Trail': 'SUV' },
  'Porsche': { 'Macan': 'SUV', 'Cayenne': 'SUV', 'Panamera': 'Sedan', 'Taycan': 'Sedan', '911': 'Coupe' },
  'Renault': { 'Kwid': 'Hatchback', 'Triber': 'MPV', 'Kiger': 'SUV', 'Duster': 'SUV' },
  'Skoda': { 'Fabia': 'Hatchback', 'Rapid': 'Sedan', 'Slavia': 'Sedan', 'Kushaq': 'SUV', 'Kodiaq': 'SUV', 'Superb': 'Sedan', 'Kylaq': 'SUV' },
  'Tata': { 'Tiago': 'Hatchback', 'Tiago EV': 'Hatchback', 'Tigor': 'Sedan', 'Tigor EV': 'Sedan', 'Altroz': 'Hatchback', 'Punch': 'SUV', 'Punch EV': 'SUV', 'Nexon': 'SUV', 'Nexon EV': 'SUV', 'Curvv': 'SUV', 'Harrier': 'SUV', 'Safari': 'SUV' },
  'Toyota': { 'Glanza': 'Hatchback', 'Urban Cruiser Taisor': 'SUV', 'Urban Cruiser Hyryder': 'SUV', 'Innova': 'MPV', 'Innova Crysta': 'MPV', 'Innova Hycross': 'MPV', 'Rumion': 'MPV', 'Fortuner': 'SUV', 'Hilux': 'Pickup', 'Camry': 'Sedan', 'Vellfire': 'MPV' },
  'Volkswagen': { 'Polo': 'Hatchback', 'Vento': 'Sedan', 'Virtus': 'Sedan', 'Taigun': 'SUV', 'Tiguan': 'SUV', 'Ameo': 'Sedan' },
  'Volvo': { 'S60': 'Sedan', 'S90': 'Sedan', 'XC40': 'SUV', 'XC60': 'SUV', 'XC90': 'SUV', 'EX30': 'SUV' }
};

export const bodyTypes = ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Coupe', 'Convertible', 'Pickup', 'Van', 'Other'];
export const brands = Object.keys(vehicleCatalog).sort((a, b) => a.localeCompare(b));
export const modelsForBrand = (brand: string) => Object.keys(vehicleCatalog[brand] || {}).sort((a, b) => a.localeCompare(b));
export const bodyForModel = (brand: string, model: string) => vehicleCatalog[brand]?.[model] || '';
