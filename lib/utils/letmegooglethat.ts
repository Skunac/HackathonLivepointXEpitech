// Function to analyze a query and determine appropriate response action
export function analyzeUserQuery(query: string): {
    action: 'answer' | 'google' | 'docs' | 'manpage';
    redirectUrl?: string;
    docSource?: string;
    command?: string;
} {
    // Clean the query
    const cleanQuery = query.trim();

    // Create URL-friendly version of the query for LMGTFY
    const encodedQuery = encodeURIComponent(cleanQuery);
    const lmgtfyUrl = `https://letmegooglethat.com/?q=${encodedQuery}`;

    // Technical terms - programming languages, frameworks, libraries, technologies
    const technicalTerms = [
        // Programming Languages
        "javascript", "python", "java", "typescript", "c#", "c++", "ruby", "go", "rust", "php", "swift",
        "kotlin", "scala", "perl", "haskell", "clojure", "erlang", "fortran", "cobol", "bash", "powershell",
        "assembly", "matlab", "r language", "dart", "groovy", "lua", "julia", "lisp", "racket", "scheme",

        // Web Technologies
        "html", "css", "dom", "json", "xml", "ajax", "xpath", "xquery", "webassembly", "wasm",
        "rest", "graphql", "soap", "oauth", "jwt", "cors", "websocket",

        // Frameworks & Libraries
        "react", "angular", "vue", "svelte", "jquery", "ember", "backbone", "redux", "mobx", "rxjs",
        "express", "nest.js", "django", "flask", "spring", "laravel", "rails", "asp.net", "symfony",
        "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "matplotlib",
        "bootstrap", "tailwind", "material-ui", "chakra ui", "next.js", "gatsby", "nuxt", "webpack",
        "vite", "rollup", "parcel", "babel", "jest", "mocha", "cypress", "selenium", "postman",
        "lodash", "moment", "axios", "requests", "beautiful soup", "puppeteer", "playwright",
        "node.js", "npm", "yarn", "pnpm", "pip", "conda", "maven", "gradle", "nuget",

        // Databases & Data
        "sql", "nosql", "mysql", "postgresql", "mongodb", "cassandra", "redis", "neo4j", "sqlite",
        "oracle", "mariadb", "dynamodb", "firebase", "supabase", "elasticsearch", "influxdb",
        "graphdb", "query", "index", "transaction", "acid", "orm", "dao", "dto", "hibernate",
        "sequelize", "mongoose", "prisma", "typeorm", "normalization", "denormalization",

        // Cloud & DevOps
        "aws", "azure", "gcp", "cloud", "serverless", "lambda", "ec2", "s3", "docker", "kubernetes",
        "terraform", "ansible", "jenkins", "github actions", "gitlab ci", "travis", "circleci",
        "nginx", "apache", "iis", "heroku", "vercel", "netlify", "digitalocean", "devops", "ci/cd",
        "load balancer", "cdn", "dns", "vpc", "subnet", "firewall", "api gateway", "iaas", "paas", "saas",

        // Security
        "oauth", "openid", "authentication", "authorization", "csrf", "xss", "sql injection",
        "encryption", "ssl", "tls", "https", "sha", "md5", "hash", "cyber", "penetration testing",
        "ddos", "firewall", "vpn", "proxy", "reverse proxy", "waf",

        // Development Concepts
        "algorithm", "data structure", "api", "sdk", "ide", "compiler", "interpreter", "runtime",
        "debug", "breakpoint", "stack trace", "exception", "error handling", "memory leak",
        "garbage collection", "thread", "async", "promise", "callback", "concurrency", "parallelism",
        "deadlock", "race condition", "mutex", "semaphore", "singleton", "factory", "observer",
        "design pattern", "solid", "dependency injection", "inversion of control", "middleware",
        "service", "controller", "model", "view", "repository", "facade", "memoization",
        "big o notation", "time complexity", "space complexity", "recursion", "iteration",
        "object-oriented", "functional programming", "immutable", "higher-order function",
        "closure", "monorepo", "microservice", "monolith", "backend", "frontend", "fullstack",

        // Operating Systems
        "linux", "unix", "macos", "windows", "ubuntu", "debian", "redhat", "centos", "alpine",
        "arch", "fedora", "suse", "bash", "powershell", "cmd", "terminal", "shell", "kernel"
    ];

    // Common command line tools with documentation links
    const commandLineTools = {
        "npm": "https://docs.npmjs.com/cli/commands/",
        "yarn": "https://yarnpkg.com/cli/",
        "pip": "https://pip.pypa.io/en/stable/cli/",
        "git": "https://git-scm.com/docs/",
        "docker": "https://docs.docker.com/engine/reference/commandline/",
        "kubectl": "https://kubernetes.io/docs/reference/kubectl/",
        "terraform": "https://developer.hashicorp.com/terraform/cli",
        "aws": "https://awscli.amazonaws.com/v2/documentation/api/latest/index.html",
        "gcloud": "https://cloud.google.com/sdk/gcloud/reference",
        "az": "https://learn.microsoft.com/en-us/cli/azure/reference-index"
    };

    // Common Linux/Unix commands that should redirect to man pages
    const bashCommands = [
        "ls", "cd", "mkdir", "touch", "cp", "mv", "rm", "chmod", "chown", "grep",
        "find", "sed", "awk", "cat", "less", "more", "head", "tail", "sort", "uniq",
        "wc", "diff", "ssh", "scp", "rsync", "curl", "wget", "tar", "zip", "unzip",
        "ps", "top", "kill", "systemctl", "journalctl", "df", "du", "free", "ifconfig",
        "ip", "netstat", "ping", "traceroute", "nslookup", "dig", "cron", "useradd",
        "usermod", "passwd", "sudo", "su", "which", "alias", "echo", "env", "export"
    ];

    // Documentation links for popular technologies
    const documentationLinks = {
        "javascript": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        "python": "https://docs.python.org/3/",
        "java": "https://docs.oracle.com/en/java/",
        "typescript": "https://www.typescriptlang.org/docs/",
        "react": "https://reactjs.org/docs/getting-started.html",
        "angular": "https://angular.io/docs",
        "vue": "https://vuejs.org/guide/introduction.html",
        "node.js": "https://nodejs.org/en/docs/",
        "django": "https://docs.djangoproject.com/",
        "flask": "https://flask.palletsprojects.com/",
        "spring": "https://spring.io/guides",
        "mongodb": "https://docs.mongodb.com/",
        "mysql": "https://dev.mysql.com/doc/",
        "postgresql": "https://www.postgresql.org/docs/",
        "docker": "https://docs.docker.com/",
        "kubernetes": "https://kubernetes.io/docs/home/",
        "aws": "https://docs.aws.amazon.com/",
        "azure": "https://learn.microsoft.com/en-us/azure/",
        "gcp": "https://cloud.google.com/docs",
        "linux": "https://www.kernel.org/doc/html/latest/",
        "bash": "https://www.gnu.org/software/bash/manual/bash.html",
        "css": "https://developer.mozilla.org/en-US/docs/Web/CSS",
        "html": "https://developer.mozilla.org/en-US/docs/Web/HTML"
    };

    // Code patterns
    const codePatterns = [
        // JS/TS function
        /function\s+\w+\s*\([^)]*\)\s*{/i,
        /const\s+\w+\s*=\s*\([^)]*\)\s*=>/i,
        // Variables
        /\b(var|let|const)\s+\w+\s*=/i,
        // Control structures
        /\b(if|for|while|switch|try|catch)\s*\(/i,
        // Class/interface definitions
        /\b(class|interface|type|enum)\s+\w+/i,
        // Import statements
        /\b(import|export|require)\b/i,
        // Python-specific
        /\bdef\s+\w+\s*\([^)]*\):/i,
        /\bclass\s+\w+\s*(\([^)]*\))?:/i,
        // SQL
        /\b(SELECT|UPDATE|DELETE|INSERT|FROM|WHERE|JOIN)\b/i,
        // HTML tags
        /<\/?[a-z][\s\S]*?>/i,
        // Config patterns
        /\{\s*["']\w+["']\s*:/i,  // JSON-like
        /^[\w-]+:\s+.+$/m         // YAML-like
    ];

    // Technical error messages
    const errorPatterns = [
        /\b(error|exception|failed|undefined|null reference|NaN|cannot|not found|syntax error)\b/i,
        /\b(TypeError|ReferenceError|SyntaxError|RangeError|EvalError|URIError)\b/i,
        /\b(status code|404|500|403|401|ENOENT|EACCES|ETIMEDOUT)\b/i
    ];

    // General non-technical patterns (more likely to be googleable)
    const nonTechnicalPatterns = [
        // News/events/weather
        /\b(news|weather|forecast|what happened|who won|when is|where is)\b/i,

        // Entertainment queries
        /\b(movie|song|tv show|actor|actress|singer|celebrity|book|author)\b/i,

        // Facts and trivia
        /\b(tallest|longest|biggest|smallest|fastest|capital of|population of|distance between)\b/i,

        // Health and lifestyle
        /\b(symptoms of|how to cure|diet|exercise|workout|recipe|how to make|how to cook)\b/i,

        // Shopping and products
        /\b(where to buy|how much is|price of|best|review|vs|versus|compared to)\b/i,

        // Travel and locations
        /\b(hotel|flight|ticket|restaurant|address|direction|map)\b/i,

        // People and history
        /\b(who is|who was|when did|when was|history of|biography)\b/i,

        // General simple factual queries
        /^(what|who|where|when|how) (is|are|was|were|did) /i
    ];

    // Documentation-specific patterns
    const docPatterns = [
        /\bhow to use\b/i,
        /\bhow to install\b/i,
        /\bsyntax for\b/i,
        /\bexample of\b/i,
        /\bapi reference\b/i,
        /\bdocumentation for\b/i,
        /\bwhat is the syntax\b/i,
        /\bfeatures of\b/i,
        /\bguide\b/i,
        /\btutorial\b/i,
        /\bhelp with\b/i
    ];

    // Command line pattern detection
    const commandLinePattern = /^\s*([a-z0-9-_]+)(\s+[a-z0-9-_]+)*(\s+(-{1,2}[a-z0-9-_]+))*\s*$/i;
    const isCommandLineRequest = commandLinePattern.test(cleanQuery);
    const firstWord = cleanQuery.split(' ')[0].toLowerCase();

    // Check for code blocks (```code```)
    const hasCodeBlock = /```[\s\S]*?```/.test(cleanQuery);

    // Check for code patterns
    const hasCodePattern = codePatterns.some(pattern => pattern.test(cleanQuery));

    // Check for error message patterns
    const hasErrorPattern = errorPatterns.some(pattern => pattern.test(cleanQuery));

    // Check for technical terms without using regex
    const hasTechnicalTerm = technicalTerms.some(term => {
        // Simple word boundary check
        const queryLower = cleanQuery.toLowerCase();
        const termLower = term.toLowerCase();

        // Check if term appears as a whole word
        return (
            queryLower === termLower ||
            queryLower.startsWith(termLower + ' ') ||
            queryLower.endsWith(' ' + termLower) ||
            queryLower.includes(' ' + termLower + ' ')
        );
    });

    // Check for non-technical patterns
    const hasNonTechnicalPattern = nonTechnicalPatterns.some(pattern => pattern.test(cleanQuery));

    // Check for documentation patterns
    const hasDocPattern = docPatterns.some(pattern => pattern.test(cleanQuery));

    // Check if any bash command is mentioned in the query
    function detectBashCommand(query: string, commandList: string[]): string | null {
        const queryLower = query.toLowerCase();

        // Look for any commands in the string
        for (const cmd of commandList) {
            // Check if command appears as a whole word
            if (
                queryLower === cmd ||
                queryLower.startsWith(cmd + ' ') ||
                queryLower.endsWith(' ' + cmd) ||
                queryLower.includes(' ' + cmd + ' ')
            ) {
                return cmd;
            }
        }

        return null;
    }

    // Check if this is about a known command line tool
    let isCommandLineTool = false;
    let commandLineToolDoc = "";
    for (const [tool, docLink] of Object.entries(commandLineTools)) {
        if (cleanQuery.toLowerCase().includes(tool.toLowerCase())) {
            isCommandLineTool = true;
            commandLineToolDoc = docLink;
            break;
        }
    }

    // Check if query is about a technology with docs
    let isTechWithDocs = false;
    let techDocLink = "";
    for (const [tech, docLink] of Object.entries(documentationLinks)) {
        // Simple string matching approach
        const techLower = tech.toLowerCase();
        const queryLower = cleanQuery.toLowerCase();

        if (
            queryLower === techLower ||
            queryLower.startsWith(techLower + ' ') ||
            queryLower.endsWith(' ' + techLower) ||
            queryLower.includes(' ' + techLower + ' ')
        ) {
            isTechWithDocs = true;
            techDocLink = docLink;
            break;
        }
    }

    // Determine appropriate action

    // 1. Check if query mentions a bash command
    const detectedCommand = detectBashCommand(cleanQuery, bashCommands);
    if (detectedCommand) {
        // Create a URL to the man page (using man.cx which redirects to man pages)
        const manPageUrl = `https://man.cx/${detectedCommand}`;
        return {
            action: 'manpage',
            command: detectedCommand,
            redirectUrl: manPageUrl
        };
    }

    // 2. Check if it's a command line tool question that should redirect to docs
    if (isCommandLineTool && hasDocPattern) {
        return {
            action: 'docs',
            redirectUrl: commandLineToolDoc,
            docSource: Object.keys(commandLineTools).find(key =>
                cleanQuery.toLowerCase().includes(key.toLowerCase())
            )
        };
    }

    // 3. Check if it's a technology question that should redirect to docs
    if (isTechWithDocs && hasDocPattern) {
        return {
            action: 'docs',
            redirectUrl: techDocLink,
            docSource: Object.keys(documentationLinks).find(key => {
                const techLower = key.toLowerCase();
                const queryLower = cleanQuery.toLowerCase();

                return (
                    queryLower === techLower ||
                    queryLower.startsWith(techLower + ' ') ||
                    queryLower.endsWith(' ' + techLower) ||
                    queryLower.includes(' ' + techLower + ' ')
                );
            })
        };
    }

    // 4. Determine if the query is technical (should be answered by agent)
    const isTechnical =
        hasCodeBlock ||
        hasCodePattern ||
        hasErrorPattern ||
        hasTechnicalTerm ||
        isCommandLineRequest;

    // If the query contains technical elements, agent should answer
    if (isTechnical) {
        return { action: 'answer' };
    }

    // 5. If it has non-technical patterns and no technical indicators, suggest Google
    if (hasNonTechnicalPattern) {
        return {
            action: 'google',
            redirectUrl: lmgtfyUrl
        };
    }

    // Default: if we're not sure, agent should answer
    return { action: 'answer' };
}