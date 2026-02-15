import { UserObject } from 'next-auth';

import { HttpResponse, http } from 'msw';

// import { create_accessToken, create_refreshToken } from "./actions";
import { RegisterSchema } from '../schemas';
import { mockMetrics, mockRetreats } from './handlerData/dashboard';
import { sections2 as sections } from './handlerData/formData';
import getUserById from './handlerData/getUserById';
import {
  MockNotification,
  createByOrigin,
  mockNotifications,
} from './handlerData/notifications';
import { mockReportDetails, mockReports } from './handlerData/reports';
import { columnsMock } from './handlerData/reports/columns';
import { mockContemplatedParticipants } from './handlerData/retreats/contemplated';
import { mockFamilies } from './handlerData/retreats/families';
import {
  MockServiceSpace,
  mockServiceSpaces,
  updateServiceSpace,
} from './handlerData/retreats/serviceSpaces';
import { mockUsers } from './handlerData/users';
import {
  ServiceSpaceMemberInput,
  ensureFamilyGroups,
  normalizeOptionalServiceSpaceMember,
  normalizeServiceSpaceMember,
  paginate,
} from './shared';

//import { handlersApi } from "./handlersApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const handlers = [
  //...handlersApi,
  http.get(`${API_BASE_URL}/user`, () => {
    return HttpResponse.json({
      id: '1',
      name: 'Vitor Admin',
      email: 'admin@email.com',
    });
  }),

  http.get(`${API_BASE_URL}/users`, ({ request }) => {
    const url = new URL(request.url);
    const payload = paginate(mockUsers, url);
    return HttpResponse.json(payload, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/users/create`, () => {
    const userId = Math.floor(Math.random() * 10) + 1;
    const user = getUserById(userId.toString());
    if (user) {
      return HttpResponse.json(user);
    }
    return HttpResponse.json(
      { error: 'Creation has failed.' },
      { status: 404 }
    );
  }),

  http.get(`${API_BASE_URL}/user/:id`, ({ params }) => {
    const userId = params.id as string;
    const user = getUserById(userId);
    if (user) {
      return HttpResponse.json(user);
    }
    return HttpResponse.json({ error: 'User not found' }, { status: 404 });
  }),

  http.get(`${API_BASE_URL}/user/:id/credentials`, ({ params }) => {
    const userId = params.id as string;
    const user = getUserById(userId);
    if (user) {
      return HttpResponse.json(createCredentialsForUser(user));
    }
    return HttpResponse.json({ error: 'User not found' }, { status: 404 });
  }),

  http.get(`${API_BASE_URL}/logout`, () => {
    return HttpResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  }),

  http.get(`${API_BASE_URL}/refresh`, () => {
    return HttpResponse.json({ accessToken: '1234' }, { status: 200 });
  }),

  // http.post(`${API_BASE_URL}/login`, async ({ request }) => {
  //   const { email, password } = (await request.json()) as LoginRequest;

  //   if (!email || !password) {
  //     return HttpResponse.json(
  //       { error: "Missing email or password" },
  //       { status: 400 }
  //     );
  //   }

  //   // ✅ Diferentes usuários com diferentes roles
  //   let user: UserObject;

  //   if (email === "admin@email.com" && password === "123") {
  //     user = createUserMock("admin");
  //   } else if (email === "manager@email.com" && password === "123") {
  //     user = createUserMock("manager");
  //   } else if (email === "consultant@email.com" && password === "123") {
  //     user = createUserMock("consultant");
  //   } else if (email === "participant@email.com" && password === "123") {
  //     user = createUserMock("participant");
  //   } else if (email === "participant2@email.com" && password === "123") {
  //     user = createUserMock("participant");
  //   } else {
  //     return HttpResponse.json(
  //       { error: "Invalid credentials" },
  //       { status: 401 }
  //     );
  //   }

  //   const mock_data: BackendJWT = {
  //     accessToken: create_accessToken(user),
  //     refreshToken: create_refreshToken(user),
  //   };

  //   return HttpResponse.json(
  //     {
  //       message: "Login successful",
  //       success: true,
  //       accessToken: mock_data.accessToken,
  //       refreshToken: mock_data.refreshToken,
  //       isNonCodeConfirmed: user.role === "participant" ? true : false,
  //       user: user.role === "participant" ? { id: user.id } : user,
  //     },
  //     { status: 200 }
  //   );
  // }),

  http.post(`${API_BASE_URL}/verify-code`, async ({ request }) => {
    const { email, code } = (await request.json()) as {
      email?: string;
      code?: string;
    };

    if (!email || !code) {
      return HttpResponse.json(
        { error: 'Missing email or code' },
        { status: 400 }
      );
    }
    // Simular verificação de código
    if (code === '123456') {
      // Código correto
      // Retornar tokens e dados do usuário
      const user = getUserById('4');
      if (user) {
        return HttpResponse.json(
          {
            message: 'Login successful',
            // accessToken: create_accessToken(user),
            // refreshToken: create_refreshToken(user),
            user,
          },
          { status: 200 }
        );
      }
    }
    return HttpResponse.json(
      { error: 'Wrong E-mail or code.' },
      { status: 400 }
    );
  }),
  http.post(`${API_BASE_URL}/register`, async ({ request }) => {
    const { email, password, code } = (await request.json()) as RegisterSchema;

    // Simular criação de usuário
    if (email && password && code === '654321') {
      return HttpResponse.json(
        {
          message: 'User registered successfully',
          success: true,
        },
        { status: 201 }
      );
    }

    if (email && password && code !== '654321') {
      return HttpResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    return HttpResponse.json(
      { error: 'Invalid registration data' },
      { status: 400 }
    );
  }),

  // Mock para /api/retreats/:id/metrics
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  http.get(`${API_BASE_URL}/retreats/:id/metrics`, ({ params }) => {
    //const id = params.id as string;
    const metrics = mockMetrics[1];
    if (metrics) {
      return HttpResponse.json(metrics, { status: 200 });
    }
    return HttpResponse.json({ error: 'Retreat not found' }, { status: 404 });
  }),

  http.get(
    `${API_BASE_URL}/retreats/:id/contemplated`,
    ({ request /*, params */ }) => {
      const url = new URL(request.url);
      const payload = paginate(mockContemplatedParticipants, url);
      return HttpResponse.json(payload, { status: 200 });
    }
  ),

  http.get(
    `${API_BASE_URL}/retreats/:id/non-contemplated`,
    ({ request /*, params */ }) => {
      const url = new URL(request.url);
      const payload = paginate(mockContemplatedParticipants, url);
      return HttpResponse.json(payload, { status: 200 });
    }
  ),

  http.get(
    `${API_BASE_URL}/retreats/:id/participants/:participantId/form`,
    ({ params }) => {
      const retreatId = params.id as string;
      const participantId = Number(params.participantId);

      const participant = mockContemplatedParticipants.find(
        (item) => item.id === participantId
      );

      const answers = {
        nome_completo: participant?.name ?? `Participante ${participantId}`,
        email: participant?.email ?? `participante${participantId}@email.com`,
        n_whatsapp: participant?.phone ?? '+55 (11) 99999-9999',
        celular: participant?.phone ?? '+55 (11) 99999-9999',
        celular_vizinho_conhecido: '+55 (11) 98888-0001',
        celular_parente_conhecido: '+55 (11) 97777-0002',
        sexo: participantId % 2 === 0 ? 'Feminino' : 'Masculino',
        cpf: '123.456.789-00',
        data_nascimento: '1990-05-12',
        idade: '33',
        estado_civil: 'Solteiro(a)',
        profissao: 'Analista de Sistemas',
        tamanho_camiseta: 'M',
        location: {
          stateShort: 'SP',
          city: 'São Paulo',
        },
        rua_e_n_casa: 'Rua das Flores, 123',
        bairro: 'Centro',
        estou_gravida: 'Não',
        peso: '75',
        altura: '177',
        nome_usuario_facebook: 'nao tenho',
        instagram: '@participante',
        'Pai está vivo?': true,
        nome_pai: 'João da Silva',
        celular_pai: '+55 (11) 95555-1111',
        grau_parentesco_preencheu: ['Pai'],
        mae_esta: true,
        nome_mae: 'Maria da Silva',
        celular_mae: '+55 (11) 96666-2222',
        sofreu_perda_familiar: false,
        expectativas_para_o_retiro:
          'Buscando crescimento espiritual e novos aprendizados.',
        possui_doenca_cronica: true,
        quais_doencas_cronicas: ['Hipertensão'],
        faz_uso_medicacao: true,
        quais_medicacoes: 'Losartana 50mg',
        restricoes_alimentares: ['Vegetariano'],
        apoio_emocional: false,
        experiencia_retiros: 'Já participei de 2 retiros anteriormente.',
        habilidades_especificas: ['Música', 'Fotografia'],
        disponibilidade_servir: true,
        termos_aceitos: true,
      } as Record<string, unknown>;

      return HttpResponse.json(
        {
          success: true,
          data: {
            retreatId,
            participantId,
            answers,
          },
        },
        { status: 200 }
      );
    }
  ),

  http.put(
    `${API_BASE_URL}/retreats/:id/participants/:participantId/form`,
    async ({ request, params }) => {
      const retreatId = params.id as string;
      const participantId = Number(params.participantId);
      const body = (await request.json()) as {
        answers: Record<string, unknown>;
      };

      return HttpResponse.json(
        {
          success: true,
          data: {
            retreatId,
            participantId,
            answers: body.answers,
          },
        },
        { status: 200 }
      );
    }
  ),

  // Update family by ID
  http.put(
    `${API_BASE_URL}/retreats/:retreatId/families/:familyId`,
    async ({ params, request }) => {
      const familyId = Number(params.familyId);
      const body = (await request.json()) as {
        name?: string;
        contactName?: string;
        contactEmail?: string;
        contactPhone?: string;
        color?: string;
      };

      const family = mockFamilies.find((f) => f.familyId === familyId);

      if (family) {
        const updatedFamily = {
          ...family,
          ...body,
          updatedAt: new Date().toISOString(),
        };

        return HttpResponse.json(updatedFamily, { status: 200 });
      }

      return HttpResponse.json(
        { error: 'Família não encontrada' },
        { status: 404 }
      );
    }
  ),

  http.get(
    `${API_BASE_URL}/retreats/:retreatId/families/lock`,
    ({ params }) => {
      const retreatId = params.retreatId as string;
      const groups = ensureFamilyGroups(retreatId);

      // Check if there's a global lock
      const globalLock = groups.every((g) => g.groupStatus === 'locked');

      return HttpResponse.json(
        {
          version: 0,
          locked: globalLock,
          families: mockFamilies.map((family) => ({
            familyId: String(family.familyId),
            familyName: family.name,
            // locked: family.isLocked ?? false,
          })),
        },
        { status: 200 }
      );
    }
  ),

  http.put(
    `${API_BASE_URL}/retreats/:id/service/spaces/:spaceId`,
    async ({ params, request }) => {
      const retreatId = params.id as string;
      const spaceId = params.spaceId as string;
      const current = mockServiceSpaces.find(
        (item) => item.id === spaceId && item.retreatId === retreatId
      );

      if (!current) {
        return HttpResponse.json(
          { error: 'Service space não encontrado' },
          { status: 404 }
        );
      }

      const body = (await request.json()) as Partial<MockServiceSpace> & {
        members?: ServiceSpaceMemberInput[];
      };

      const patch: Partial<MockServiceSpace> = {};

      if (typeof body.name === 'string') {
        patch.name = body.name;
      }

      if (typeof body.description === 'string') {
        patch.description = body.description;
      }

      if (
        typeof body.minMembers === 'number' &&
        !Number.isNaN(body.minMembers)
      ) {
        patch.minMembers = Math.max(1, Math.floor(body.minMembers));
      }

      if (body.coordinator !== undefined) {
        patch.coordinator = normalizeOptionalServiceSpaceMember(
          body.coordinator as ServiceSpaceMemberInput | null | undefined,
          0,
          current.coordinator?.name ?? 'Coordenador'
        );
      }

      if (body.viceCoordinator !== undefined) {
        patch.viceCoordinator = normalizeOptionalServiceSpaceMember(
          body.viceCoordinator as ServiceSpaceMemberInput | null | undefined,
          1,
          current.viceCoordinator?.name ?? 'Vice responsável'
        );
      }

      if (Array.isArray(body.members)) {
        patch.members = body.members.map((member, index) =>
          normalizeServiceSpaceMember(member, index, `Membro ${index + 1}`)
        );
      }

      const updated = updateServiceSpace(spaceId, patch);

      return HttpResponse.json(
        { success: true, data: updated },
        { status: 200 }
      );
    }
  ),

  http.get(`${API_BASE_URL}/retreats/:id/families/rules`, ({ params }) => {
    const retreatId = params.id as string;

    return HttpResponse.json(
      {
        success: true,
        retreatId,
        rules: {
          maxMembersPerFamily: 6,
          genderBalance: {
            enabled: true,
            ratio: 0.5,
            tolerance: 1,
            label: '50% homens / 50% mulheres',
          },
          preventSameRealFamily: true,
          preventSameCity: true,
        },
      },
      { status: 200 }
    );
  }),

  // Family configuration endpoints
  http.get(`${API_BASE_URL}/retreats/:id/families/config`, () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          config: {
            defaultFamilySize: 6,
            maxFamilySize: 8,
            totalFamilies: mockFamilies.length,
            totalParticipants: 42,
          },
        },
      },
      { status: 200 }
    );
  }),

  http.put(
    `${API_BASE_URL}/retreats/:id/families/config`,
    async ({ request }) => {
      const body = (await request.json()) as {
        defaultFamilySize: number;
        maxFamilySize: number;
      };

      return HttpResponse.json(
        {
          success: true,
          message: 'Configuração das famílias atualizada com sucesso',
          data: {
            config: body,
          },
        },
        { status: 200 }
      );
    }
  ),

  // Get available participants for a retreat (legacy endpoint)
  http.get(`${API_BASE_URL}/retreats/:id/participants/available`, () => {
    const mockParticipants = [
      {
        id: 1,
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-1111',
        age: 25,
        isAssigned: false,
        location: 'São Paulo, SP',
      },
      {
        id: 2,
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '(11) 99999-2222',
        age: 32,
        isAssigned: false,
        location: 'Rio de Janeiro, RJ',
      },
      {
        id: 3,
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.com',
        phone: '(11) 99999-3333',
        age: 28,
        isAssigned: false,
        location: 'Belo Horizonte, MG',
      },
      {
        id: 4,
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        phone: '(11) 99999-4444',
        age: 29,
        isAssigned: false,
        location: 'Porto Alegre, RS',
      },
      {
        id: 5,
        name: 'Carlos Pereira',
        email: 'carlos.pereira@email.com',
        phone: '(11) 99999-5555',
        age: 35,
        isAssigned: false,
        location: 'Salvador, BA',
      },
      {
        id: 6,
        name: 'Fernanda Lima',
        email: 'fernanda.lima@email.com',
        phone: '(11) 99999-6666',
        age: 27,
        isAssigned: false,
        location: 'Brasília, DF',
      },
      {
        id: 7,
        name: 'Ricardo Mendes',
        email: 'ricardo.mendes@email.com',
        phone: '(11) 99999-7777',
        age: 31,
        isAssigned: false,
        location: 'Curitiba, PR',
      },
      {
        id: 8,
        name: 'Juliana Ferreira',
        email: 'juliana.ferreira@email.com',
        phone: '(11) 99999-8888',
        age: 26,
        isAssigned: false,
        location: 'Fortaleza, CE',
      },
      {
        id: 9,
        name: 'Rafael Alves',
        email: 'rafael.alves@email.com',
        phone: '(11) 99999-9999',
        age: 33,
        isAssigned: false,
        location: 'Recife, PE',
      },
      {
        id: 10,
        name: 'Luciana Rocha',
        email: 'luciana.rocha@email.com',
        phone: '(11) 99999-0000',
        age: 24,
        isAssigned: false,
        location: 'Goiânia, GO',
      },
    ];

    return HttpResponse.json(mockParticipants, { status: 200 });
  }),

  // Add participants to family endpoint
  http.post(
    `${API_BASE_URL}/retreats/:id/families/add-participants`,
    async ({ request }) => {
      const body = (await request.json()) as {
        familyId: string;
        participantIds: number[];
        role: 'leader' | 'member';
      };

      return HttpResponse.json(
        {
          success: true,
          message: `${body.participantIds.length} participante(s) adicionado(s) à família com sucesso`,
          data: {
            familyId: body.familyId,
            addedParticipants: body.participantIds.length,
            role: body.role,
          },
        },
        { status: 200 }
      );
    }
  ),

  http.get(`${API_BASE_URL}/public/retreats`, ({ request /*, params */ }) => {
    const url = new URL(request.url);

    const isSelectAutocomplete =
      url.searchParams.get('selectAutocomplete') === 'true';
    //url.searchParams.get("variant") === "selectAutocomplete" ||
    // url.searchParams.get("type") === "selectAutocomplete";

    if (isSelectAutocomplete) {
      const search = (url.searchParams.get('search') || '').toLowerCase();

      let list = mockRetreats;

      if (search) {
        list = list.filter((r) => r.name.toLowerCase().includes(search));
      }

      // Optional limit for autocomplete (default 20)
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const sliced = list.slice(0, isNaN(limit) ? 20 : limit);

      return HttpResponse.json(
        {
          options: sliced.map((r) => ({
            value: r.id,
            label: r.name,
            // extra metadata if needed by frontend
            startDate: r.startDate,
            endDate: r.endDate,
          })),
          total: list.length,
        },
        { status: 200 }
      );
    }

    // Fallback to normal paginated payload
    const payload = paginate(mockRetreats, url);
    return HttpResponse.json(payload, { status: 200 });
  }),

  // Public retreats endpoint supporting selectAutocomplete variant

  http.get(`${API_BASE_URL}/public/retreats/:id`, ({ params }) => {
    const id = params.id as string;
    const retreat = mockRetreats.find((r) => r.id.toString() === id);
    if (retreat) {
      return HttpResponse.json(retreat, { status: 200 });
    }
    return HttpResponse.json({ error: 'Retreat not found' }, { status: 404 });
  }),

  http.get(
    `${API_BASE_URL}/public/retreats/:id/form/participant`,
    ({ params }) => {
      const id = params.id as string;

      const form = {
        id: `retreat-${id}-participant-form`,
        title: 'Inscrição - XV RahaminVIDA',
        description: 'Preencha seus dados para participar do retiro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections,
      };

      return HttpResponse.json(form, { status: 200 });
    }
  ),

  http.get(
    `${API_BASE_URL}/public/retreats/:id/form/service-team`,
    ({ params }) => {
      const id = params.id as string;

      const form = {
        id: `retreat-${id}-service-team-form`,
        title: 'Inscrição - XV RahaminVIDA - Equipe de Serviço',
        description: 'Preencha seus dados para servir no retiro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections,
      };

      return HttpResponse.json(form, { status: 200 });
    }
  ),

  http.put(`${API_BASE_URL}/Registrations/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = await request.json();
    const participant = mockContemplatedParticipants.find((p) => p.id === id);

    if (!participant) {
      return HttpResponse.json(
        { error: 'Participante não encontrado' },
        { status: 404 }
      );
    }

    // Update the participant in the mock data
    Object.assign(participant, body);

    return HttpResponse.json(
      {
        ...participant,
        message: 'Participante atualizado com sucesso',
      },
      { status: 200 }
    );
  }),

  http.delete(`${API_BASE_URL}/Registrations/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockContemplatedParticipants.findIndex((p) => p.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { error: 'Participante não encontrado' },
        { status: 404 }
      );
    }

    // Remove from mock data
    mockContemplatedParticipants.splice(index, 1);

    return HttpResponse.json(
      { message: 'Participante excluído com sucesso' },
      { status: 200 }
    );
  }),

  http.get(`${API_BASE_URL}/reports`, ({ request }) => {
    const url = new URL(request.url);
    const payload = paginate(mockReports, url);
    return HttpResponse.json(payload, { status: 200 });
  }),

  // GET - Obter relatório específico
  http.get(`${API_BASE_URL}/reports/:id`, ({ params }) => {
    const id = params.id as string;
    const report = mockReportDetails.find((r) => {
      const item = r as { id?: unknown };
      return item.id == id;
    });

    if (report) {
      const detail = report as {
        columns?: unknown;
        rows?: unknown;
        summary?: { totalFamilies?: number; totalParticipants?: number };
      };

      const reportColumns = Array.isArray(detail.columns)
        ? (detail.columns as unknown[])
        : columnsMock;

      const reportRows = Array.isArray(detail.rows)
        ? (detail.rows as unknown[])
        : [];

      const total =
        typeof detail.summary?.totalFamilies === 'number'
          ? detail.summary.totalFamilies
          : reportRows.length;

      return HttpResponse.json(
        {
          report,
          columns: reportColumns,
          total,
          page: 1,
          pageLimit: 0,
        },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      { error: 'Relatório não encontrado' },
      { status: 404 }
    );
  }),

  // POST - Criar novo relatório
  http.post(`${API_BASE_URL}/reports`, async ({ request }) => {
    const newReport = await request.json();

    // Garante que newReport é um objeto
    const reportData =
      typeof newReport === 'object' && newReport !== null ? newReport : {};

    // Simula a criação atribuindo um ID
    const createdReport = {
      ...reportData,
      id: (mockReports.length + 1).toString(),
      dateCreation: new Date().toISOString(),
    };

    return HttpResponse.json(createdReport, { status: 201 });
  }),

  // PUT - Atualizar relatório existente
  http.put(`${API_BASE_URL}/reports/:id`, async ({ params, request }) => {
    const id = params.id as string;
    const updatedData = await request.json();

    const reportData =
      typeof updatedData === 'object' && updatedData !== null
        ? updatedData
        : {};
    const reportExists = mockReports.some((r) => r.id === id);

    if (!reportExists) {
      return HttpResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }

    // Simula a atualização
    const updatedReport = {
      ...reportData,
      id,
    };

    return HttpResponse.json(updatedReport, { status: 200 });
  }),

  // DELETE - Excluir relatório
  http.delete(`${API_BASE_URL}/reports/:id`, ({ params }) => {
    const id = params.id as string;
    const reportExists = mockReports.some((r) => r.id === id);

    if (!reportExists) {
      return HttpResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }

    // Simula a exclusão retornando uma mensagem de sucesso
    return HttpResponse.json(
      {
        message: 'Relatório excluído com sucesso',
        id,
      },
      { status: 200 }
    );
  }),

  // ---- Endpoints de Notificações ----
  http.get(`${API_BASE_URL}/notifications`, () => {
    return HttpResponse.json(mockNotifications, { status: 200 });
  }),

  http.post(
    `${API_BASE_URL}/notifications/mark-all-read`,
    async ({ request }) => {
      try {
        const body = (await request.json()) as { ids?: Array<number | string> };
        const ids = (body?.ids ?? []).map((v) => Number(v));
        if (ids.length) {
          for (const n of mockNotifications) {
            if (ids.includes(Number(n.id))) n.read = true;
          }
        } else {
          // se não enviar ids, marca todas
          mockNotifications.forEach((n) => (n.read = true));
        }
        return HttpResponse.json({ success: true }, { status: 200 });
      } catch {
        return HttpResponse.json({ success: false }, { status: 400 });
      }
    }
  ),

  http.post(`${API_BASE_URL}/notifications/:id/read`, ({ params }) => {
    const id = Number(params.id as string);
    const item = mockNotifications.find((n) => n.id === id);
    if (item) {
      item.read = true;
      return HttpResponse.json({ success: true }, { status: 200 });
    }
    return HttpResponse.json(
      { error: 'Notification not found' },
      { status: 404 }
    );
  }),

  // ---- SSE: envia 1 notificação/minuto por 3 vezes ----
  http.get(`${API_BASE_URL}/notifications/stream`, ({ request }) => {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Dica de reconexão do SSE
        controller.enqueue(encoder.encode('retry: 10000\n\n'));
        let sent = 0;
        const origins: MockNotification['origin'][] = [
          'payment_confirmed',
          'family_filled',
          'registration_completed',
        ];

        // Heartbeat para manter a conexão viva
        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(':\n\n'));
        }, 15001);

        const timer = setInterval(() => {
          // Verifica se já temos 10 notificações no total
          if (mockNotifications.length >= 10) {
            clearInterval(timer);
            clearInterval(keepAlive);
            try {
              controller.close();
            } catch {}
            return;
          }

          const origin = origins[sent % origins.length];
          const retreatIds = (mockRetreats || []).map((r) => r.id) as number[];
          const retreatId =
            retreatIds.length > 0
              ? retreatIds[Math.floor(Math.random() * retreatIds.length)]
              : 1;

          const notif = createByOrigin(origin, retreatId);
          // adiciona ao topo
          mockNotifications.unshift(notif);

          // evento SSE
          controller.enqueue(encoder.encode('event: notification\n'));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(notif)}\n\n`)
          );

          sent += 1;
          if (sent >= 3) {
            clearInterval(timer);
            clearInterval(keepAlive);
            try {
              controller.close();
            } catch {}
          }
        }, 3_000); // 3s

        // Abort/cancel

        request?.signal?.addEventListener?.('abort', () => {
          clearInterval(timer);
          clearInterval(keepAlive);
          try {
            controller.close();
          } catch {}
        });
      },
      cancel() {
        // noop (garantido via abort acima)
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }),

  http.get(
    `${API_BASE_URL}/unhandled/retreats`,
    ({ request /*, params */ }) => {
      const url = new URL(request.url);

      const isSelectAutocomplete =
        url.searchParams.get('selectAutocomplete') === 'true';
      //url.searchParams.get("variant") === "selectAutocomplete" ||
      // url.searchParams.get("type") === "selectAutocomplete";

      if (isSelectAutocomplete) {
        const search = (url.searchParams.get('search') || '').toLowerCase();

        let list = mockRetreats;

        if (search) {
          list = list.filter((r) => r.name.toLowerCase().includes(search));
        }

        // Optional limit for autocomplete (default 20)
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const sliced = list.slice(0, isNaN(limit) ? 20 : limit);

        return HttpResponse.json(
          {
            options: sliced.map((r) => ({
              value: r.id,
              label: r.name,
              // extra metadata if needed by frontend
              // isActive: r.status === "running" || r.status === "open",
              isActive: true,
              startDate: r.startDate,
              endDate: r.endDate,
              location: r.location,
            })),
            total: list.length,
          },
          { status: 200 }
        );
      }

      // Fallback to normal paginated payload
      const payload = paginate(mockRetreats, url);
      return HttpResponse.json(payload, { status: 200 });
    }
  ),

  //fallback handler for unhandled requests
  // http.all("http://localhost:5001/*", ({ request }) => {
  //   console.warn("⚠️ Unhandled request:", request.method, request.url);
  //   return HttpResponse.json({ error: "Endpoint not mocked" }, { status: 404 });
  // }),
];
function createCredentialsForUser(
  user: UserObject
): import('msw').JsonBodyType {
  return {
    login: user.name + ' login',
    email: user.email,
    emailVerified: Math.random() < 0.5, // Randomly true or false
  };
}
