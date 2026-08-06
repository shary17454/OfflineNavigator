export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  // otplib يعتمد على @scure/* وهي حزم ESM بحتة (export/import)، وJest يتجاهل
  // node_modules افتراضيًا. نسمح تحديدًا بتحويل هذه الحزم فقط، لا كل node_modules.
  transformIgnorePatterns: ['/node_modules/(?!(@scure|@noble|@otplib|otplib)/)'],
};
