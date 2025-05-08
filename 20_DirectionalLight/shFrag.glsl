#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;  
in vec3 normal;  
in vec3 color;

struct Material {
    sampler2D diffuse; // diffuse map
    vec3 specular;     // 표면의 specular color
    float shininess;   // specular 반짝임 정도
};

struct Light {
    //vec3 position;
    vec3 direction;
    vec3 ambient; // ambient 적용 strength
    vec3 diffuse; // diffuse 적용 strength
    vec3 specular; // specular 적용 strength
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform float toonLevel;

void main() {
    // ambient
    vec3 rgb = color;
    vec3 ambient = light.ambient * rgb;
  	
    // diffuse 
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    vec3 diffuse = light.diffuse * diff * rgb;  
    
    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);

    float dotViewDirReflectDir = dot(viewDir, reflectDir);
    float spec;
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    }
    else spec = 0.0f;

    vec3 specular = light.specular * spec * material.specular;  

    // result
    vec3 result = ambient + diffuse + specular;
    result = (round(result * toonLevel - 0.5) + 0.5) / toonLevel;
    FragColor = vec4(result, 1.0);
} 