export const convertToCSV = (data) => {
  if (data.length === 0) return "";
  
  // Exact order: id, name, gender, gender_probability, age, age_group, country_id, country_name, country_probability, created_at
  const headers = ["id","name","gender","gender_probability","age","age_group","country_id","country_name","country_probability","created_at"];
  
  const rows = data.map(p => headers.map(header => {
    let val = p[header] ?? ""; // Handle nulls
    if (header === 'created_at') val = new Date(val).toISOString();
    
    // Escape existing quotes and wrap in quotes
    const escaped = String(val).replace(/"/g, '""');
    return `"${escaped}"`;
  }).join(","));
  
  return [headers.join(","), ...rows].join("\n");
};