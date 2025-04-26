// Helper function to convert entries to markdown
// app/lib/helper.js
export function markdownToEntries(markdown, sectionName) {
  if (!markdown) return [];
  
  const sectionRegex = new RegExp(`## ${sectionName}\\s+([\\s\\S]+?)(?=##|$)`, 'i');
  const sectionMatch = markdown.match(sectionRegex);
  
  if (!sectionMatch) return [];
  
  const entries = [];
  const entryRegex = /### (.+?) @ (.+?)\s+\*\*(.+?)\s+-\s+(.+?)\*\*\s+([\s\S]+?)(?=\n###|$)/g;
  let match;
  
  while ((match = entryRegex.exec(sectionMatch[1])) !== null) {
    entries.push({
      title: match[1].trim(),
      organization: match[2].trim(),
      startDate: match[3].trim(),
      endDate: match[4].trim(),
      current: match[4].toLowerCase().includes('present'),
      description: match[5].trim(),
    });
  }
  
  return entries;
}

// app/lib/helper.js
export function entriesToMarkdown(entries, sectionName) {
  if (!entries || entries.length === 0) return null;

  const entriesMarkdown = entries.map(entry => {
    const dateRange = entry.current 
      ? `**${entry.startDate} - Present**` 
      : `**${entry.startDate} - ${entry.endDate}**`;
    
    return `### ${entry.title} @ ${entry.organization}\n${dateRange}\n\n${entry.description}`;
  }).join('\n\n');

  return `## ${sectionName}\n\n${entriesMarkdown}`;
}