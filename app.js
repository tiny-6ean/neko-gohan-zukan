let foods = [
  {
    name: "チキンレシピA",
    ingredients: "鶏肉、鶏肉ミール、コーン、米、魚油",
    analysis: { protein: 35, fat: 15, fiber: 3 },
    reaction: { finishRate: 0.9, interest: 4 }
  },
  {
    name: "フィッシュレシピB",
    ingredients: "白身魚、サーモン、エンドウ豆、ポテト",
    analysis: { protein: 32, fat: 14, fiber: 2 },
    reaction: { finishRate: 0.7, interest: 3 }
  },
  {
    name: "グレインフリーC",
    ingredients: "ターキー、チキン、エンドウ豆、ひよこ豆",
    analysis: { protein: 40, fat: 18, fiber: 4 },
    reaction: { finishRate: 0.95, interest: 5 }
  }
];

function tagIngredients(text) {
  text = text.toLowerCase();
  const tags = [];
  const rules = [
    { key: ["鶏", "チキン", "chicken"], tag: "肉系:チキン" },
    { key: ["ターキー", "turkey"], tag: "肉系:ターキー" },
    { key: ["牛", "ビーフ", "beef"], tag: "肉系:ビーフ" },
    { key: ["豚", "ポーク", "pork"], tag: "肉系:ポーク" },
    { key: ["ラム", "lamb"], tag: "肉系:ラム" },

    { key: ["魚", "フィッシュ", "fish"], tag: "魚系" },
    { key: ["サーモン", "salmon"], tag: "魚系:サーモン" },
    { key: ["白身魚"], tag: "魚系:白身" },
    { key: ["まぐろ", "ツナ", "tuna"], tag: "魚系:マグロ" },

    { key: ["コーン"], tag: "植物:穀物" },
    { key: ["米", "rice"], tag: "植物:穀物" },
    { key: ["小麦", "wheat"], tag: "植物:穀物" },

    { key: ["エンドウ", "pea"], tag: "植物:豆類" },
    { key: ["ひよこ豆", "chickpea"], tag: "植物:豆類" },
    { key: ["レンズ豆", "lentil"], tag: "植物:豆類" },

    { key: ["ミール", "meal"], tag: "副産物" },
    { key: ["副産物", "by-product"], tag: "副産物" },

    { key: ["油", "オイル", "oil"], tag: "脂質" },
    { key: ["魚油", "fish oil"], tag: "脂質:魚油" },
    { key: ["鶏脂", "chicken fat"], tag: "脂質:鶏脂" },

    { key: ["グレインフリー"], tag: "特徴:グレインフリー" },
    { key: ["無添加"], tag: "特徴:無添加" },
    { key: ["オーガニック"], tag: "特徴:オーガニック" }
  ];

  rules.forEach(rule => {
    rule.key.forEach(k => {
      if (text.includes(k.toLowerCase())) tags.push(rule.tag);
    });
  });

  return [...new Set(tags)];
}

function tagAnalysis(a) {
  const tags = [];

  if (a.protein >= 38) tags.push("高タンパク");
  else if (a.protein <= 30) tags.push("低タンパク");

  if (a.fat >= 20) tags.push("高脂質");
  else if (a.fat <= 10) tags.push("低脂質");

  if (a.fiber >= 4) tags.push("繊維多め");
  if (a.fiber <= 2) tags.push("繊維少なめ");

  return tags;
}

let filterTag = "";
let searchQuery = "";
let sortKey = "";

function renderFoodsTable() {
  const tbody = document.querySelector("#foods-table tbody");
  tbody.innerHTML = "";

  let list = [...foods];

  if (searchQuery) {
    list = list.filter(f =>
      f.name.toLowerCase().includes(searchQuery) ||
      f.ingredients.toLowerCase().includes(searchQuery)
    );
  }

  if (filterTag) {
    list = list.filter(f => {
      const tags = [...tagIngredients(f.ingredients), ...tagAnalysis(f.analysis)];
      return tags.includes(filterTag);
    });
  }

  if (sortKey === "finish") list.sort((a,b)=>b.reaction.finishRate - a.reaction.finishRate);
  if (sortKey === "interest") list.sort((a,b)=>b.reaction.interest - a.reaction.interest);
  if (sortKey === "protein") list.sort((a,b)=>b.analysis.protein - a.analysis.protein);

  list.forEach((food, index) => {
    const tags = [...tagIngredients(food.ingredients), ...tagAnalysis(food.analysis)];

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${food.name}</td>
      <td>${food.ingredients}</td>
      <td>${tags.map(t => `<span class="tag">${t}</span>`).join("")}</td>
      <td>P:${food.analysis.protein}% / F:${food.analysis.fat}% / Fb:${food.analysis.fiber}%</td>
      <td class="${food.reaction.finishRate >= 0.85 ? "good" : "bad"}">
        ${(food.reaction.finishRate * 100).toFixed(0)}%
      </td>
      <td>${"★".repeat(food.reaction.interest)}</td>
      <td>
        <button class="btn" onclick="editFood(${index})">編集</button>
        <button class="btn" onclick="deleteFood(${index})">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editFood(index) {
  const f = foods[index];
  const form = document.querySelector("#food-form");

  form.name.value = f.name;
  form.ingredients.value = f.ingredients;
  form.protein.value = f.analysis.protein;
  form.fat.value = f.analysis.fat;
  form.fiber.value = f.analysis.fiber;
  form.finishRate.value = f.reaction.finishRate * 100;
  form.interest.value = f.reaction.interest;

  form.dataset.editIndex = index;
}

function deleteFood(index) {
  if (!confirm("削除しますか？")) return;
  foods.splice(index, 1);
  saveToLocal();
  renderFoodsTable();
  renderTagsTable();
}

function renderTagsTable() {
  const tagStats = {};

  foods.forEach(food => {
    const tags = [...tagIngredients(food.ingredients), ...tagAnalysis(food.analysis)];
    tags.forEach(tag => {
      if (!tagStats[tag]) tagStats[tag] = { count: 0, sumFinish: 0, sumInterest: 0 };
      tagStats[tag].count++;
      tagStats[tag].sumFinish += food.reaction.finishRate;
      tagStats[tag].sumInterest += food.reaction.interest;
    });
  });

  const tbody = document.querySelector("#tags-table tbody");
  tbody.innerHTML = "";

  Object.entries(tagStats).forEach(([tag, stat]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${tag}</td>
      <td>${stat.count}</td>
      <td>${(stat.sumFinish / stat.count * 100).toFixed(0)}%</td>
      <td>${(stat.sumInterest / stat.count).toFixed(1)}</td>
    `;
    tbody.appendChild(tr);
  });

  renderTagsChart(tagStats);
}

let tagsChart;

function renderTagsChart(tagStats) {
  const labels = Object.keys(tagStats);
  const finishRates = labels.map(t => (tagStats[t].sumFinish / tagStats[t].count) * 100);
  const interests = labels.map(t => tagStats[t].sumInterest / tagStats[t].count);

  const ctx = document.getElementById("tagsChart");

  if (tagsChart) tagsChart.destroy();

  tagsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "平均完食率(%)",
          data: finishRates,
          backgroundColor: "#ff8a3d"
        },
        {
          label: "平均食いつき(1〜5)",
          data: interests,
          backgroundColor: "#ffd7b3"
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function downloadJSON() {
  const blob = new Blob([JSON.stringify(foods, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "foods.json";
  a.click();
  URL.revokeObjectURL(url);
}

document.querySelector("#json-upload").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  foods = JSON.parse(text);
  saveToLocal();
  renderFoodsTable();
  renderTagsTable();
});

function saveToLocal() {
  localStorage.setItem("catFoods", JSON.stringify(foods));
}

function loadFromLocal() {
  const data = localStorage.getItem("catFoods");
  if (!data) return;
  foods = JSON.parse(data);
}

document.querySelector("#food-form").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);

  const newFood = {
    name: f.get("name"),
    ingredients: f.get("ingredients"),
    analysis: {
      protein: Number(f.get("protein")),
      fat: Number(f.get("fat")),
      fiber: Number(f.get("fiber"))
    },
    reaction: {
      finishRate: Number(f.get("finishRate")) / 100,
      interest: Number(f.get("interest"))
    }
  };

  const editIndex = e.target.dataset.editIndex;

  if (editIndex !== undefined) {
    foods[editIndex] = newFood;
    delete e.target.dataset.editIndex;
  } else {
    foods.push(newFood);
  }

  saveToLocal();
  renderFoodsTable();
  renderTagsTable();
  e.target.reset();
});

function setupFilterUI() {
  const select = document.createElement("select");
  select.id = "tag-filter";
  select.style.marginRight = "8px";
  document.body.insertBefore(select, document.body.children[2]);

  const tags = new Set();
  foods.forEach(f => {
    [...tagIngredients(f.ingredients), ...tagAnalysis(f.analysis)].forEach(t => tags.add(t));
  });

  select.innerHTML = `<option value="">タグ絞り込みなし</option>` +
    [...tags].map(t => `<option value="${t}">${t}</option>`).join("");

  select.onchange = e => {
    filterTag = e.target.value;
    renderFoodsTable();
  };

  const search = document.createElement("input");
  search.placeholder = "検索（名前・原材料）";
  search.style.marginRight = "8px";
  document.body.insertBefore(search, document.body.children[2]);

  search.oninput = e => {
    searchQuery = e.target.value.toLowerCase();
    renderFoodsTable();
  };

  const sort = document.createElement("select");
  sort.id = "sort";
  sort.innerHTML = `
    <option value="">並び替えなし</option>
    <option value="finish">完食率</option>
    <option value="interest">食いつき</option>
    <option value="protein">タンパク質</option>
  `;
  document.body.insertBefore(sort, document.body.children[2]);

  sort.onchange = e => {
    sortKey = e.target.value;
    renderFoodsTable();
  };
}

loadFromLocal();
setupFilterUI();
renderFoodsTable();
renderTagsTable();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/neko-gohan-zukan/service-worker.js");
}

