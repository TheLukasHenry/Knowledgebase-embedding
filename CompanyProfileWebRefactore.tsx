import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { View, ScrollView, Alert, Image, Text } from 'react-native'
import getStyle from './styles'
import CustomButtonWebBlue from '../../components/CustomButtonWeb/BlueButton'
import DropdownUserInfoWeb from '../../components/DropDownUserInoWeb'
import CustomTextInput from '../../components/TextInput/WebTextInput'
import CardTemplate from '../../components/CardTemplate'
import GetCompanyInterface from '../../interface/GetCompanyInterface'
import { _uploadImage, defaultMDTConstant } from '../Services/Services'
import { useForm, Controller } from 'react-hook-form'
import { ErrorMessage } from '@hookform/error-message'
import CustomAlert from '../../components/AlertBox'
import {
  CompanyLogos,
  _getCompanyLogos,
  _updateCompany,
} from '../Services/CompanyProfileServices'
import { TextInput } from '../../components/form/TextInput'
import { useToast } from 'react-native-toast-notifications'
import { _getFileTypes } from '../../Drawer/Questions/QuestionManagement/GetTypes'
import { getFileType, getFileUrl } from '../../utils/utils'
import BrandTypeInterface from '../../interface/BrandTypeInterface'
import AddLogoButton from '../../components/AddLogo/AddLogoButton'
import MDTConstantInterface from '../../interface/MDTConstantInterface'
import { colors } from '../../utils/colors'
import { brandTypes } from '../../utils/constants'
import { RootState } from '../../../../redux/store'
import { useSelector } from 'react-redux'
import Button from '../../../../customComponents/Button'

// addd
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { TextInput as PaperInput } from 'react-native-paper'

const acceptedFileTypes =
  'image/png,image/gif,image/jpeg,application/pdf,.xlsx,video/mp4,.csv'
const acceptedFileExtension = ['jpg', 'jpeg', 'gif', 'png']
const CompanyProfileWebRefactored = ({
  company,
}: // setCompany,
{
  company: any
  //setCompany: React.Dispatch<any>;
}) => {
  const profile = useSelector((state: RootState) => state.profile)
  const { Role } = profile
  const router = useRouter()
  const toast = useToast()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoFileMobile, setLogoFileMobile] = useState<File | null>(null)
  const [logoPreviewURL, setLogoPreviewURL] = useState<string | null>(null) // web
  const [logoPreviewURLMobile, setLogoPreviewURLMobile] = useState<
    string | null
  >(null) // mobile
  const [logoErrorMessage, setLogoErrorMessage] = useState<boolean>()
  const [logoBrandType, setLogoBrandType] = useState<BrandTypeInterface | null>(
    null
  )
  const [logoBrandTypeMobile, setLogoBrandTypeMobile] =
    useState<BrandTypeInterface | null>(null)

  const logoFileRef = React.useRef(null)

  // addd
  console.log('profile: ', profile)
  console.log('company: ', company)
  const schema = yup.object().shape({
    mdtConstants: yup.array().of(
      yup.object().shape({
        constantId: yup.number().required(),
        tenantId: yup.number().required(),
        name: yup.string().required(),
        createDate: yup.date().required(),
        createdBy: yup.number().nullable(),
        mdT_Year: yup.number().required(),
        modifiedBy: yup.number().required(),
        value: yup.number().required(),
      })
    ),
    modifiedBy: yup.number().required(),
    tenantAbbrev: yup.string().required(),
    tenantAddress: yup.object().shape({
      addressId: yup.number().required(),
      tenantId: yup.number().required(),
      streetAddress1: yup.string().required(),
      streetAddress2: yup.string().required(),
      city: yup.string().required(),
      stateCode: yup.string().required(),
      zip: yup.string().required(),
      createDate: yup.date().required(),
      createdBy: yup.number().required(),
      modifiedBy: yup.number().required(),
      updateDate: yup.date().required(),
    }),
    tenantId: yup.number().required(),
    tenantName: yup.string().required(),
    tenantQuestionsAlgSetting: yup.object().shape({
      tenantQuestionsAlgSettingsId: yup.number().required(),
      tenantId: yup.number().required(),
      totalQuestions: yup.number().required(),
      createDate: yup.date().required(),
      createdBy: yup.number().required(),
      modifiedBy: yup.number().required(),
      passingMDT: yup.number().required(),
      questionTime: yup.number().required(),
      questionsAgeWeighting: yup.number().required(),
      questionsCountBeforeRepeat: yup.number().required(),
      questionsPerQuarter: yup.number().required(),
      timeMultiplier: yup.number().required(),
      updateDate: yup.date().required(),
    }),
    updateDate: yup.date().required(),
    url: yup.string().required(),
  })

  interface QuestionsInfo {
    name: string
    perQuarter: number
    totalQuestions: number
  }
  const styles = getStyle

  const questionInfo: QuestionsInfo[] = [
    { name: 'General', perQuarter: 15, totalQuestions: 15 },
    { name: 'General', perQuarter: 15, totalQuestions: 15 },
    { name: 'General', perQuarter: 15, totalQuestions: 15 },
  ]
  const authenticationType = [
    'Username/Password',
    'Office 365',
    'Company Portal',
  ]

  const tempMDTDefault = {
    ...defaultMDTConstant[0],
    tenantId: company.tenantId,
  }

  const {
    control,
    //addd
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    resolver: yupResolver(schema),
    defaultValues: {
      ...company,
      mdtConstants:
        company.mdtConstants?.length > 0
          ? company.mdtConstants
          : [tempMDTDefault],
    },
  })

  const handleCompanyUpdate = async (data: GetCompanyInterface) => {
    const isValid = await schema.isValid(data) // Check if the form data is valid

    if (isValid) {
      data.authenticationTypeId = company.authenticationTypeId
      const finalData = {
        ...data,
        mdtConstants: data.mdtConstants.filter((i) => {
          if (
            //i.value !== "" &&
            i.value !== null &&
            i.value !== 0 //&&
            // i.value !== "0"
          ) {
            return i
          }
        }),
      }

      if (!logoErrorMessage) {
        await _updateCompany(data.tenantId, finalData)
          .then((respData) => {
            const status = respData.status
            if (status === 200) {
              toast.show('Success! Company was updated.', {
                type: 'success',
              })
            }
          })
          .catch((error) => {
            Alert.alert(error)
            toast.show(`Error! ${error}`, {
              type: 'danger',
            })
          })
      }

      // Upload new logos
      if (logoFile) {
        await handleUploadImageToDB(data.tenantId, logoFile, logoBrandType)
      }
      if (logoFileMobile) {
        await handleUploadImageToDB(
          data.tenantId,
          logoFileMobile,
          logoBrandTypeMobile
        )
      }
    } else {
      toast.show('Error! Please fill out all required fields.', {
        type: 'danger',
      })
      return
    }
  }

  const onErrors = () => {
    CustomAlert('Check', `Error in Validating User`)
  }

  const handleUploadImageToDB = async (
    tenantId: number,
    file: File,
    bType: BrandTypeInterface
  ) => {
    const dbFileTypes = await _getFileTypes()

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (reader.result) {
        const base64URL: string = reader.result.toString().split(',')[1]
        _uploadImage({
          brandTypeId: bType.brandTypeId || 1,
          brandId: 0,
          base64: base64URL,
          name: file.name?.slice(0, 20),
          logoFileName: file.name?.slice(
            file?.name?.length > 20 ? file?.name?.length - 20 : 0,
            file?.name?.length
          ),
          tenantId: tenantId,
          date: new Date(),
          fileTypeId: getFileType(file.name, dbFileTypes),
        }).then((resp) => {
          if (logoErrorMessage) {
            toast.show(
              `Invalid file type. Please upload one of the following: jpg/jpeg, gif, or png`,
              {
                type: 'danger',
              }
            )
          } else {
            // if (resp?.message === "Tenant logo uploaded") {
            toast.show(
              `Success! Your ${bType.brandTypeName} logo was uploaded.`,
              {
                type: 'success',
              }
            )
            // }
          }
        })
      }
    }
  }

  const handleLogoClick = (event: {
    target: { files: React.SetStateAction<File | null>[] }
  }) => {
    logoFileRef.current.click()
  }

  const handleLogoChange = (event: {
    target: { files: React.SetStateAction<File | null>[] }
  }) => {
    const selectedFile = logoFileRef.current.files[0]
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase()
      if (acceptedFileExtension.includes(fileExtension)) {
        setLogoErrorMessage(false)
      } else {
        setLogoErrorMessage(true)
      }
    }
    if (logoBrandType?.brandTypeId === 1) {
      setLogoFile(event.target.files[0])
      setLogoPreviewURL(getFileUrl({ file: event.target.files[0] }))
      setLogoBrandType(brandTypes[0])
      return
    } else if (logoBrandType?.brandTypeId === 2) {
      setLogoFileMobile(event.target.files[0])
      setLogoPreviewURLMobile(getFileUrl({ file: event.target.files[0] }))
      setLogoBrandTypeMobile(brandTypes[1])

      // We just updated brand type to 2 so we can set for mobile, we now set brand type back to 1 so we upload the correct type
      if (logoBrandType?.brandTypeId === 2) {
        setLogoBrandType(brandTypes[0])
      }
      return
    } else {
      setLogoFile(event.target.files[0])
      setLogoPreviewURL(getFileUrl({ file: event.target.files[0] }))

      setLogoFileMobile(event.target.files[0])
      setLogoPreviewURLMobile(getFileUrl({ file: event.target.files[0] }))

      setLogoBrandType(brandTypes[2])
      setLogoBrandTypeMobile(brandTypes[2])
      return
    }
  }

  const handleMDTConstantChange = (
    value: any,
    v: string,
    name: string,
    id: number
  ) => {
    const temp = JSON.parse(JSON.stringify(value))
    const tempVal = temp?.findIndex(
      (item: { name: any }) => item?.name === name
    )

    if (tempVal === -1) {
      const newMDT: MDTConstantInterface = {
        constantId: id,
        tenantId: company.tenantId,
        name: name,
        value: v,
        mdT_Year: new Date().getFullYear(),
        createDate: new Date(),
        updateDate: new Date(),
        createdBy: null,
        modifiedBy: 0,
      }
      temp.push(newMDT)
    } else {
      temp[tempVal].value = v
      temp[tempVal].tenantId = company.tenantId
    }
    return temp
  }

  const deactivateCompany = async () => {
    const res = await _updateCompany(company.tenantId, {
      ...company,
      active: false,
    })

    if (res) {
      toast.show('This company was deactivated.', {
        type: 'warning',
      })
    }
  }

  const getCompanyLogo = async () => {
    const logos: CompanyLogos = await _getCompanyLogos(company.tenantId)

    // get web/mobile logos
    setLogoPreviewURL(logos.web)
    setLogoPreviewURLMobile(logos.mobile)
    if (logos.webBrandType) {
      setLogoBrandType(brandTypes[logos.webBrandType - 1])
    }
    if (logos.mobileBrandType) {
      setLogoBrandTypeMobile(brandTypes[logos.mobileBrandType - 1])
    }
  }

  useEffect(() => {
    if (company.tenantId) {
      getCompanyLogo()
    }
  }, [company])

  return (
    <ScrollView>
      <form onSubmit={handleSubmit(handleCompanyUpdate, onErrors)}>
        <CardTemplate
          title="Company Information refactored"
          children={
            <View style={styles.compInfo}>
              <View style={[styles.contentwidth, styles.inputItem]}>
                <Controller
                  control={control}
                  render={({ field }) => (
                    <PaperInput
                      label="Name"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.tenantName?.message}
                    />
                  )}
                  name="tenantName"
                  defaultValue=""
                />
                <ErrorMessage
                  errors={errors}
                  name="tenantName"
                  render={({ message }) => (
                    <Text style={styles.error}>{message}</Text>
                  )}
                />
              </View>
              <View style={[styles.contentwidth, styles.inputItem]}>
                <Controller
                  control={control}
                  render={({ field }) => (
                    <PaperInput
                      label="Tenant Abbreviation"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                  name="tenantAbbrev"
                  // rules={{ required: 'Tenant abbreviation is required' }}
                  defaultValue=""
                />
                <ErrorMessage
                  errors={errors}
                  name="tenantAbbrev"
                  render={({ message }) => (
                    <Text style={styles.error}>{message}</Text>
                  )}
                />
              </View>
              <View style={styles.contentwidth}>
                <TextInput
                  disabled={true}
                  control={control}
                  name="url"
                  label="URL"
                  placeholder="example.aimelearning.com"
                  errors={errors}
                  errorMessage="URL is required"
                />
              </View>
              <View style={{ zIndex: -1, width: '100%' }}>
                <AddLogoButton
                  handleLogo={handleLogoClick}
                  selectBrandType={setLogoBrandType}
                />

                <input
                  ref={logoFileRef}
                  accept={acceptedFileTypes}
                  type={'file'}
                  style={{ display: 'none' }}
                  onChange={handleLogoChange}
                />

                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'space-between',
                  }}
                >
                  {logoPreviewURL && (
                    <View
                      style={{
                        marginTop: 24,
                        marginBottom: 24,
                        width: '50%',
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'center',
                          marginBottom: 6,
                        }}
                      >
                        Web
                      </Text>
                      <View
                        style={{
                          height: 200,
                          width: '100%',
                        }}
                      >
                        <Image
                          source={logoPreviewURL}
                          style={{
                            height: '100%',
                            width: '100%',
                          }}
                          resizeMode="contain"
                        />
                        {logoErrorMessage && (
                          <Text style={{ color: 'red' }}>
                            Invalid file type. Please upload one of the
                            following: jpg/jpeg, gif, or png
                          </Text>
                        )}
                      </View>

                      {/* <View style={{flexDirection: "row", alignItems: "center", marginLeft: 20}}>
												<View>
													<Text>Web</Text>
													<Checkbox disabled status={logoPreviewURL ? "checked" : "unchecked"}/>
												</View>
												<View>
													<Text>Mobile</Text>
													<Checkbox disabled status={logoPreviewURLMobile ? "checked" : "unchecked"}/>
												</View>
											</View> */}
                    </View>
                  )}

                  {logoPreviewURLMobile && (
                    <View
                      style={{
                        marginTop: 24,
                        marginBottom: 24,
                        width: '50%',
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'center',
                          marginBottom: 6,
                        }}
                      >
                        Mobile
                      </Text>
                      <View
                        style={{
                          height: 200,
                          width: '100%',
                        }}
                      >
                        <Image
                          source={logoPreviewURLMobile}
                          style={{
                            height: '100%',
                            width: '100%',
                          }}
                          resizeMode="contain"
                        />
                      </View>

                      {/* <View style={{flexDirection: "row", alignItems: "center", marginLeft: 20}}>
												<View>
													<Text>Web</Text>
													<Checkbox disabled status={logoPreviewURL ? "checked" : "unchecked"}/>
												</View>
												<View>
													<Text>Mobile</Text>
													<Checkbox disabled status={logoPreviewURLMobile ? "checked" : "unchecked"}/>
												</View>
											</View> */}
                    </View>
                  )}
                </View>
              </View>
            </View>
          }
        />

        {/* ******** ADDRESS ******** */}
        <View style={[styles.content, { zIndex: -1 }]}>
          <View style={styles.contentwidth}>
            <CardTemplate
              title="Address"
              children={
                <View style={styles.contentHeightWidth}>
                  {/* TODO: Break these into there own address component */}
                  <Controller
                    control={control}
                    name="tenantAddress"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          style={styles.inputItem}
                          label="Address 1"
                          placeholder="Address 1"
                          secureTextEntry={false}
                          value={value ? value?.streetAddress1 : ''}
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            const temp = JSON.parse(JSON.stringify(value))
                            temp.streetAddress1 = v

                            onChange(temp)
                          }}
                          type={undefined}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="tenantAddress"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                  <Controller
                    control={control}
                    name="tenantAddress"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          style={styles.inputItem}
                          label="Address 2"
                          placeholder="Address 2"
                          secureTextEntry={false}
                          value={value ? value?.streetAddress2 : ''}
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            const temp = JSON.parse(JSON.stringify(value))
                            temp.streetAddress2 = v

                            onChange(temp)
                          }}
                          type={undefined}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="tenantAddress"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />

                  <Controller
                    control={control}
                    name="tenantAddress"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          style={styles.inputItem}
                          label="City"
                          placeholder="City"
                          secureTextEntry={false}
                          value={value ? value?.city : ''}
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            const temp = JSON.parse(JSON.stringify(value))
                            temp.city = v

                            onChange(temp)
                          }}
                          type={undefined}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="tenantAddress"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                  <View style={styles.address}>
                    <View style={styles.contentwidth}>
                      <Controller
                        control={control}
                        name="tenantAddress"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <>
                            <CustomTextInput
                              style={styles.inputItem}
                              label="State Abbreviation"
                              placeholder="State Abbreviation"
                              secureTextEntry={false}
                              value={value ? value?.stateCode : ''}
                              onBlur={onBlur}
                              onChangeText={(v) => {
                                if (v.length > 2) {
                                  return
                                }
                                const temp = JSON.parse(JSON.stringify(value))
                                temp.stateCode = v
                                onChange(temp)
                              }}
                              type={undefined}
                            />
                            <ErrorMessage
                              errors={errors}
                              name="tenantAddress"
                              render={({ message }) => (
                                <p style={styles.errorMessage}>{message}</p>
                              )}
                            />
                          </>
                        )}
                      />
                    </View>
                    <View style={styles.contentwidth}>
                      <Controller
                        control={control}
                        name="tenantAddress"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <>
                            <CustomTextInput
                              style={styles.inputItem}
                              label="Zip Code"
                              placeholder="Zip Code"
                              secureTextEntry={false}
                              value={value ? value?.zip : ''}
                              onBlur={onBlur}
                              onChangeText={(v) => {
                                const temp = JSON.parse(JSON.stringify(value))
                                temp.zip = v

                                onChange(temp)
                              }}
                              type={undefined}
                            />
                            <ErrorMessage
                              errors={errors}
                              name="tenantAddress"
                              render={({ message }) => (
                                <p style={styles.errorMessage}>{message}</p>
                              )}
                            />
                          </>
                        )}
                      />
                    </View>
                  </View>
                </View>
              }
            />
          </View>

          {/* ******** MDT CONSTANTS ******** */}
          <View style={[styles.contentwidth]}>
            <CardTemplate
              title="MDT DEFAULTS"
              children={
                <View style={styles.contentHeightWidth}>
                  <Controller
                    control={control}
                    name="mdtConstants"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          type="number"
                          keyboardType="number"
                          style={styles.inputItem}
                          label="% of Measurement 1"
                          placeholder="% of Measurement 1"
                          secureTextEntry={false}
                          value={
                            value
                              ? value
                                  ?.find(
                                    (v: { name: string }) =>
                                      v?.name === 'Pm1 Value'
                                  )
                                  ?.value?.toString()
                              : ''
                          }
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            const temp = handleMDTConstantChange(
                              value,
                              v,
                              'Pm1 Value',
                              1
                            )
                            onChange(temp)
                          }}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="mdtConstants"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                  {/* addd */}

                  <Controller
                    control={control}
                    name="mdtConstants"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          type="number"
                          keyboardType="number"
                          style={styles.inputItem}
                          label="Measurement 1 Default"
                          placeholder="Measurement 1 Default"
                          secureTextEntry={false}
                          value={
                            value
                              ? value
                                  ?.find(
                                    (v: { name: string }) =>
                                      v?.name === 'm1_default'
                                  )
                                  ?.value?.toString()
                              : ''
                          }
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            const temp = handleMDTConstantChange(
                              value,
                              v,
                              'm1_default',
                              2
                            )
                            onChange(temp)
                          }}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="mdtConstants"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                  <Controller
                    control={control}
                    name="mdtConstants"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          type="number"
                          keyboardType="number"
                          style={styles.inputItem}
                          label="Measurement 2 Default"
                          placeholder="Measurement 2 Default"
                          secureTextEntry={false}
                          value={
                            value
                              ? value
                                  ?.find(
                                    (v: { name: string }) =>
                                      v?.name === 'm2_default'
                                  )
                                  ?.value?.toString()
                              : ''
                          }
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            const temp = handleMDTConstantChange(
                              value,
                              v,
                              'm2_default',
                              3
                            )
                            onChange(temp)
                          }}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="mdtConstants"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                  <Controller
                    control={control}
                    name="mdtConstants"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          type="number"
                          keyboardType="number"
                          style={styles.inputItem}
                          label="Extra Measurement 1"
                          placeholder="Extra Measurement 1"
                          secureTextEntry={false}
                          value={
                            value
                              ? value
                                  ?.find(
                                    (v: { name: string }) =>
                                      v?.name === 'm1_derived'
                                  )
                                  ?.value?.toString()
                              : ''
                          }
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            const temp = handleMDTConstantChange(
                              value,
                              v,
                              'm1_derived',
                              4
                            )
                            onChange(temp)
                          }}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="mdtConstants"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                  <Controller
                    control={control}
                    name="mdtConstants"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          type="number"
                          keyboardType="number"
                          style={styles.inputItem}
                          label="Extra Measurement 2"
                          placeholder="Extra Measurement 2"
                          secureTextEntry={false}
                          value={
                            value
                              ? value
                                  ?.find(
                                    (v: { name: string }) =>
                                      v?.name === 'm2_derived'
                                  )
                                  ?.value?.toString()
                              : ''
                          }
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            const temp = handleMDTConstantChange(
                              value,
                              v,
                              'm2_derived',
                              5
                            )
                            onChange(temp)
                          }}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="mdtConstants"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                </View>
              }
            />
          </View>
        </View>

        {/* ******** QUESTION SETTINGS ******** */}
        <View style={[styles.content, { zIndex: -1 }]}>
          <View style={{ width: '100%' }}>
            <CardTemplate
              title="Question Settings"
              children={
                <View style={[{ marginTop: 24 }]}>
                  {/* TODO: Break these into there own address component */}
                  <Controller
                    control={control}
                    name="tenantQuestionsAlgSetting"
                    render={({ field: { onChange, value, onBlur } }) => {
                      return (
                        <>
                          <CustomTextInput
                            disabled={true}
                            style={styles.inputItem}
                            label="Total Questions in Pool"
                            placeholder="Total Questions in Pool"
                            secureTextEntry={false}
                            value={
                              value ? value?.totalQuestions?.toString() : ''
                            }
                            onBlur={onBlur}
                            onChangeText={(v) => {
                              onChange({
                                ...value,
                                totalQuestions: v,
                              })
                            }}
                            type={undefined}
                          />
                          <ErrorMessage
                            errors={errors}
                            name="tenantQuestionsAlgSetting"
                            render={({ message }) => (
                              <p style={styles.errorMessage}>{message}</p>
                            )}
                          />
                        </>
                      )
                    }}
                  />
                  <Controller
                    control={control}
                    name="tenantQuestionsAlgSetting"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          style={styles.inputItem}
                          label="Questions Per Quarter"
                          placeholder="Questions Per Quarter"
                          secureTextEntry={false}
                          value={
                            value ? value?.questionsPerQuarter?.toString() : ''
                          }
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            onChange({
                              ...value,
                              questionsPerQuarter: v,
                            })
                          }}
                          type={undefined}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="tenantQuestionsAlgSetting"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />

                  <Controller
                    control={control}
                    name="tenantQuestionsAlgSetting"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          style={styles.inputItem}
                          label="Default Time Per Question (seconds)"
                          placeholder="Default Time Per Question (seconds)"
                          secureTextEntry={false}
                          value={value ? value?.questionTime?.toString() : ''}
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            onChange({
                              ...value,
                              questionTime: v,
                            })
                          }}
                          type={undefined}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="tenantQuestionsAlgSetting"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                  <Controller
                    control={control}
                    name="tenantQuestionsAlgSetting"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          style={styles.inputItem}
                          label="Question Count Before Repeat"
                          placeholder="Question Count Before Repeat"
                          secureTextEntry={false}
                          value={
                            value
                              ? value?.questionsCountBeforeRepeat?.toString()
                              : ''
                          }
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            onChange({
                              ...value,
                              questionsCountBeforeRepeat: v,
                            })
                          }}
                          type={undefined}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="tenantAddress"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                  <Controller
                    control={control}
                    name="tenantQuestionsAlgSetting"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <CustomTextInput
                          disabled={true}
                          style={styles.inputItem}
                          label="Question Age Weighting"
                          placeholder="Question Age Weighting"
                          secureTextEntry={false}
                          value={
                            value
                              ? value?.questionsAgeWeighting?.toString()
                              : ''
                          }
                          onBlur={onBlur}
                          onChangeText={(v) => {
                            onChange({
                              ...value,
                              questionsAgeWeighting: v,
                            })
                          }}
                          type={undefined}
                        />
                        <ErrorMessage
                          errors={errors}
                          name="tenantQuestionsAlgSetting"
                          render={({ message }) => (
                            <p style={styles.errorMessage}>{message}</p>
                          )}
                        />
                      </>
                    )}
                  />
                </View>
              }
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginBottom: 20,
            alignSelf: 'flex-start',
          }}
        >
          {Role === 'SuperAdmin' && (
            <Button
              mode="outlined"
              text={'Deactivate'}
              style={{ width: 288, marginLeft: 20, marginRight: 20 }}
              onPress={deactivateCompany}
            />
          )}
          <Button
            mode="contained"
            text={'Update'}
            style={{ width: 288 }}
            onPress={handleSubmit(handleCompanyUpdate, onErrors)}
            // onPress={handleSubmit(handleCompanyUpdate)}
          />
          {/* make a submit button here */}
          <button type="submit">Submit</button>
        </View>
      </form>
    </ScrollView>
  )
}
export default CompanyProfileWebRefactored
