export function Log4JExplanation() {
  return (
    <section className="bg-gradient-to-l from-orange-50 to-orange-100 p-8 rounded-lg shadow-lg mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Primera Columna: Texto Explicativo */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            What is a Log4j File?
          </h2>
          <p className="text-gray-700 leading-6 mb-4">
            A Log4j file is a configuration file used by the Log4j logging
            framework, a widely adopted tool in Java-based applications. It
            provides details about how an application should log its events,
            including log levels and output destinations like files or
            databases.
          </p>
          <p className="text-gray-700 leading-6 mb-4">
            Properly configured Log4j files are essential for debugging and
            monitoring, ensuring optimal system performance and security.
          </p>
          <p className="text-gray-700 leading-6 bg-white p-4 rounded-md shadow-sm">
            ⚠️ <span className="font-bold">Privacy Notice:</span> This tool
            processes your files entirely on your local device. No data is sent
            to any server, ensuring maximum privacy and security for your
            sensitive log files.
          </p>
        </div>

        {/* Segunda Columna: Tabla Comparativa */}
        <div className="overflow-x-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Why Choose This Tool Over Paid Alternatives?
          </h3>
          <table className="table-auto w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-4 py-2">Feature</th>
                <th className="px-4 py-2">This Tool</th>
                <th className="px-4 py-2">Log4View (Paid)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-orange-100">
                <td className="border px-4 py-2">Cost</td>
                <td className="border px-4 py-2 text-green-600 font-bold">
                  Free
                </td>
                <td className="border px-4 py-2 text-red-600 font-bold">
                  $99+ (License Fee)
                </td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Ease of Use</td>
                <td className="border px-4 py-2">Simple Drag & Drop</td>
                <td className="border px-4 py-2">Requires Setup</td>
              </tr>
              <tr className="bg-orange-100">
                <td className="border px-4 py-2">Platform Support</td>
                <td className="border px-4 py-2">Web-Based (Cross-Platform)</td>
                <td className="border px-4 py-2">Windows Only</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Real-Time Analysis</td>
                <td className="border px-4 py-2">Yes</td>
                <td className="border px-4 py-2">Yes</td>
              </tr>
              <tr className="bg-orange-100">
                <td className="border px-4 py-2">Privacy</td>
                <td className="border px-4 py-2">Processed Locally</td>
                <td className="border px-4 py-2">Unknown</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
