import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    primary: {
      main: "#1f6feb",
      light: "#6ea8ff",
      dark: "#1849a9"
    },
    secondary: {
      main: "#2e8b57",
      light: "#6bc48d",
      dark: "#1d5f3a"
    },
    background: {
      default: "#f3f7fb",
      paper: "#ffffff"
    },
    text: {
      primary: "#12324a",
      secondary: "#5b7285"
    }
  },
  shape: {
    borderRadius: 18
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: -0.7 },
    h2: { fontWeight: 800, letterSpacing: -0.5 },
    h3: { fontWeight: 800, letterSpacing: -0.4 },
    h4: { fontWeight: 800, letterSpacing: -0.3 },
    h5: { fontWeight: 750 },
    h6: { fontWeight: 750 },
    button: {
      fontWeight: 700,
      textTransform: "none"
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at 8% 12%, rgba(0,150,136,0.12), transparent 26%), radial-gradient(circle at 92% 10%, rgba(3,169,244,0.11), transparent 24%), radial-gradient(circle at 50% 95%, rgba(76,175,80,0.08), transparent 30%), #f3f8fb"
        },
        "*::-webkit-scrollbar": {
          width: 10,
          height: 10
        },
        "*::-webkit-scrollbar-thumb": {
          background: "rgba(18,50,74,0.22)",
          borderRadius: 999
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 18,
          minHeight: 44
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          border: "1px solid rgba(18,50,74,0.08)",
          boxShadow: "0 20px 60px rgba(18,50,74,0.08)",
          transition: "transform 180ms ease, box-shadow 180ms ease"
        }
      }
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          borderRadius: 22
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        }
      }
    }
  }
});
