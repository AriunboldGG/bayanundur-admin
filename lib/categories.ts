export interface Category {
  id: string
  name: string
  nameEn: string
  icon?: string
  children?: Category[]
}

export const categories: Category[] = [
  {
    id: "1",
    name: "Хувь хүнийг хамгаалах хувцас хэрэгсэл",
    nameEn: "Personal protective equipment",
    icon: "shield",
    children: [
      {
        id: "1-1",
        name: "Толгойн хамгаалалт",
        nameEn: "Head protection",
        children: [
          {
            id: "1-1-1",
            name: "Малгай, каск",
            nameEn: "Hats, helmets",
          },
          {
            id: "1-1-2",
            name: "Нүүрний хамгаалалт, нүдний шил",
            nameEn: "Face protection, glasses",
          },
          {
            id: "1-1-3",
            name: "Гагнуурын баг, дагалдах хэрэгсэлт",
            nameEn: "Welding masks, accessories",
          },
          {
            id: "1-1-4",
            name: "Амьсгал хамгаалах маск, хошуувч",
            nameEn: "Respiratory protection masks, respirators",
          },
          {
            id: "1-1-5",
            name: "Чихэвч, чихний бөглөө",
            nameEn: "Earphones, earplugs",
          },
          {
            id: "1-1-6",
            name: "Баг шүүлтүүр",
            nameEn: "Filter bags",
          },
        ],
      },
      {
        id: "1-2",
        name: "Хамгаалалтын хувцас",
        nameEn: "Protective clothing",
      },
      {
        id: "1-3",
        name: "Гар хамгаалалтын хувцас хэрэгсэл",
        nameEn: "Hand protective clothing and equipment",
      },
      {
        id: "1-4",
        name: "Хөл хамгаалалтын хувцас хэрэгсэл",
        nameEn: "Foot protective clothing and equipment",
      },
      {
        id: "1-5",
        name: "Өндрөөс хамгаалах хэрэгсэл",
        nameEn: "Fall protection equipment",
      },
    ],
  },
  {
    id: "2",
    name: "Аврах хамгаалах багаж хэрэгсэл",
    nameEn: "Rescue and protective equipment",
    icon: "gear",
    children: [
      {
        id: "2-1",
        name: "Аюулгүйн цоож пайз",
        nameEn: "Safety lock tag",
      },
      {
        id: "2-2",
        name: "Цахилгааны хамгаалалтын багаж",
        nameEn: "Electrical protection equipment",
      },
      {
        id: "2-3",
        name: "Тэмдэг тэмдэглэгээ",
        nameEn: "Signs and markings",
      },
      {
        id: "2-4",
        name: "Гэрэл, чийдэн",
        nameEn: "Lights, lamps",
      },
      {
        id: "2-5",
        name: "Осолын үеийн багаж хэрэгсэл",
        nameEn: "Emergency equipment",
      },
    ],
  },
  {
    id: "3",
    name: "Ажлын байрны хэвийн ажиллагааг хангах",
    nameEn: "Ensuring normal operation of the workplace",
    icon: "wrench",
    children: [
      {
        id: "3-1",
        name: "Дуу чимээ, тоосжилт",
        nameEn: "Noise, dust",
      },
    ],
  },
]

// Helper function to get full category path
export function getCategoryPath(categoryId: string): string {
  for (const mainCat of categories) {
    if (mainCat.id === categoryId) {
      return mainCat.name
    }
    if (mainCat.children) {
      for (const subCat of mainCat.children) {
        if (subCat.id === categoryId) {
          return `${mainCat.name} / ${subCat.name}`
        }
        if (subCat.children) {
          for (const subSubCat of subCat.children) {
            if (subSubCat.id === categoryId) {
              return `${mainCat.name} / ${subCat.name} / ${subSubCat.name}`
            }
          }
        }
      }
    }
  }
  return ""
}

// Helper function to find category by ID
export function findCategoryById(categoryId: string): Category | null {
  for (const mainCat of categories) {
    if (mainCat.id === categoryId) {
      return mainCat
    }
    if (mainCat.children) {
      for (const subCat of mainCat.children) {
        if (subCat.id === categoryId) {
          return subCat
        }
        if (subCat.children) {
          for (const subSubCat of subCat.children) {
            if (subSubCat.id === categoryId) {
              return subSubCat
            }
          }
        }
      }
    }
  }
  return null
}

// Get all categories as flat list with paths
export function getAllCategoriesFlat(): Array<{ id: string; path: string; name: string }> {
  const result: Array<{ id: string; path: string; name: string }> = []
  
  for (const mainCat of categories) {
    result.push({
      id: mainCat.id,
      path: mainCat.name,
      name: mainCat.name,
    })
    
    if (mainCat.children) {
      for (const subCat of mainCat.children) {
        result.push({
          id: subCat.id,
          path: `${mainCat.name} / ${subCat.name}`,
          name: subCat.name,
        })
        
        if (subCat.children) {
          for (const subSubCat of subCat.children) {
            result.push({
              id: subSubCat.id,
              path: `${mainCat.name} / ${subCat.name} / ${subSubCat.name}`,
              name: subSubCat.name,
            })
          }
        }
      }
    }
  }
  
  return result
}

