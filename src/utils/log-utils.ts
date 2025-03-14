const getLevelBadgeColor = (level: string) => {
  switch (level) {
    case "DEBUG":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "INFO":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "WARN":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "ERROR":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "FATAL":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export default getLevelBadgeColor;
