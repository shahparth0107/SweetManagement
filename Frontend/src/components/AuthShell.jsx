import { Box, Paper, Typography } from '@mui/material';

export default function AuthShell({ title, subtitle='SIGN IN', children }) {
  const APPBAR_H = 60;
  return (
    <Box
      sx={{
        minHeight: `calc(100vh - ${APPBAR_H}px)`,
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 1.5, md: 4 },
        py: { xs: 2, md: 3 },
        mx: 'calc(50% - 50vw)',
        bgcolor: (t) => t.palette.grey[50],
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: { xs: '96vw', sm: '92vw', md: 'min(92vw, 1040px)' },
          minHeight: { xs: 420, md: 520 },
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }, // stack on phones
          position: 'relative',
        }}
      >
        {/* Left gradient (hide on phones) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            width: '44%',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            position: 'relative',
            background:
              'linear-gradient(135deg,#ff8bb3 0%, #ff6d6d 40%, #ff5f9a 100%)',
          }}
        >
          <Box sx={{
            position:'absolute', inset:0,
            background:
              'radial-gradient(800px 400px at -20% 0%, rgba(255,255,255,.35), transparent 60%), radial-gradient(800px 400px at 120% 100%, rgba(255,255,255,.25), transparent 50%)',
          }} />
          <Typography sx={{ position:'relative', fontWeight:700, letterSpacing:4, opacity:.9, transform:'rotate(-90deg)' }}>
            {subtitle}
          </Typography>
          <Box sx={{
            position:'absolute', right:-50, top:'50%', transform:'translateY(-50%)',
            width:100, height:220, bgcolor:'background.paper',
            borderTopLeftRadius:120, borderBottomLeftRadius:120,
            boxShadow:(t)=>t.shadows[8]
          }} />
        </Box>

        {/* Right: form */}
        <Box sx={{ flex:1, p:{ xs:3, md:5 }, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <Typography variant="h4" sx={{ fontWeight:800, mb: { xs:1, md:2 } }}>{title}</Typography>
          {children}
        </Box>
      </Paper>
    </Box>
  );
}
