import PageHeader from "./PageHeader.jsx";
import RowActions from "./RowActions.jsx";

// Generic sample page for the modules proposed in the architecture report.
export default function SampleModule({ title, subtitle, features, columns, rows }) {
  // An "Actions" column holds slash-separated labels ("Edit / Delete") that are
  // rendered as a "⋮" menu instead of plain text, like the real module tables.
  const actionsIndex = columns ? columns.indexOf("Actions") : -1;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      {features && (
        <section className="panel">
          <h2>Key Features</h2>
          <ul className="feature-list">
            {features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {columns && (
        <section className="panel">
          <h2>Sample Data</h2>
          <table>
            <thead>
              <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {r.map((cell, j) => (
                    <td key={j}>
                      {j === actionsIndex && typeof cell === "string" ? (
                        <RowActions
                          items={cell.split("/").map((label) => ({
                            label: label.trim(),
                            danger: /delete|remove|cancel/i.test(label),
                          }))}
                        />
                      ) : typeof cell === "string" && /^(paid|unpaid|open|closed|synced|active|pending|low|ok|resolved)$/i.test(cell) ? (
                        <span className={"badge " + cell.toLowerCase()}>{cell}</span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
