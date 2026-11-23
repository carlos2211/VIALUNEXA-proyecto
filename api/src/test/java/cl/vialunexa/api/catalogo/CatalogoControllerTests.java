package cl.vialunexa.api.catalogo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CatalogoControllerTests {

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new CatalogoController("abc1234")).build();
    }

    @Test
    void versionInformaElCommitDesplegado() throws Exception {
        mvc.perform(get("/api/version"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.servicio").value("vialunexa-api"))
            .andExpect(jsonPath("$.commit").value("abc1234"));
    }

    @Test
    void tarifasCoincidenConElPrototipo() throws Exception {
        mvc.perform(get("/api/tarifas"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].modalidad").value("vehiculo"))
            .andExpect(jsonPath("$[0].tarifaBase").value(10000))
            .andExpect(jsonPath("$[1].valorKm").value(500));
    }

    @Test
    void serviciosListaLosDoceTipos() throws Exception {
        mvc.perform(get("/api/servicios"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(12))
            .andExpect(jsonPath("$[6].nombre").value("Aeropuerto"));
    }
}
