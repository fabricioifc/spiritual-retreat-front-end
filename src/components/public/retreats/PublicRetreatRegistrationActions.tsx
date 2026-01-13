'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';

interface PublicRetreatRegistrationActionsProps {
  retreatId: string;
  registrationDisabled?: boolean;
}

export function PublicRetreatRegistrationActions({
  retreatId,
  registrationDisabled = false,
}: PublicRetreatRegistrationActionsProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    'participate' | 'serve' | null
  >(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const openDialog = (action: 'participate' | 'serve') => {
    setAcceptedTerms(false);
    setSelectedAction(action);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedAction(null);
  };

  const handleParticipateConfirm = () => {
    if (!acceptedTerms || !selectedAction) {
      return;
    }
    setIsDialogOpen(false);
    const destination =
      selectedAction === 'participate'
        ? `/public/retreats/${retreatId}/register/participate`
        : `/public/retreats/${retreatId}/register/serve`;
    router.push(destination);
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={() => openDialog('participate')}
          disabled={registrationDisabled}
        >
          Preencher Inscrição Participar
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={() => openDialog('serve')}
          disabled={registrationDisabled}
        >
          Preencher Inscrição Servir
        </Button>
      </Box>

      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Aviso antes de continuar</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <Typography variant="body1">
            Inscrições com o mesmo CPF não serão aceitas. Verifique se você já
            se inscreveu neste retiro antes de prosseguir.
          </Typography>
          <Typography variant="body1">
            Verifique com os voluntários responsáveis se há vagas disponíveis
            para CPFs que ja participaram anteriormente de um retiro.
          </Typography>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Termos e condições
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ao continuar, você confirma que as informações fornecidas são
              verdadeiras e autoriza o uso dos seus dados para fins de
              comunicação sobre este retiro. Você também concorda que qualquer
              descumprimento das regras do evento pode resultar no cancelamento
              da inscrição.
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />
            }
            label="Li e aceito os termos e condições"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button
            onClick={handleParticipateConfirm}
            variant="contained"
            color="primary"
            disabled={!acceptedTerms || !selectedAction}
          >
            Ir para o formulário
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
