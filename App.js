import React,  { Component, useState, PureComponent } from "react";
import Helmet from 'react-helmet';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import './react-day-picker-style.css';
import { Container, Row, Col } from "reactstrap";
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { Layout, Divider, Empty, Select, Statistic, Spin } from "antd";
import moment from 'moment'
import {
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  Label,
  ComposedChart
} from "recharts";
import logo from "./logo.svg";
import "./App.css";
import "./body.css";
import "antd/dist/antd.css";
import { ApolloProvider } from "@apollo/react-hooks";
import cubejs from "@cubejs-client/core";
import { CubeProvider } from "@cubejs-client/react";
import client from "./graphql/client";
import Header from "./components/Header";
import { QueryRenderer, QueryBuilder } from "@cubejs-client/react";
import { find, propEq } from "ramda";

const API_URL = (process.env.REACT_APP_API_URL == undefined) ? "http://195.201.40.181:4000" : process.env.REACT_APP_API_URL;
const CUBEJS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1OTA2Nzc3ODUsImV4cCI6MTU5MDc2NDE4NX0.NjRFQZpN6ptEKhMsQUJtCxgkUrvMTP6v-10sI2-HVT0";
const cubejsApi = cubejs(CUBEJS_TOKEN, {
  apiUrl: `${API_URL}/cubejs-api/v1`
});
const colors = ['#EF4136', '#44A2FF', 'orange', '#7AD273', ' #704791', 'cyan', 'magenta', '#FFEA7A'];//['#FF6492', '#141446', '#7A77FF'];   //red, blue, orange, green, purple, cyan, magenta, yellow
var okrugFilter = [];
var allOkrugs = ["Дальневосточный",
  "Приволжский",
  "Северо-Западный",
  "Северо-Кавказский",
  "Сибирский",
  "Уральский",
  "Центральный",
  "Южный"
];
var charts = [];

const numberRender = ({ resultSet, title }) => (
  <Row type="flex" justify="center" align="middle" style={{ height: '100%' }}>
    <Col>
      {resultSet
        .seriesNames()
        .map(s => (
          <Statistic value={resultSet.totalRow()[s.key]} title={title} />
        ))}
    </Col>
  </Row>
);

const renderChart = (Component, text) => ({ resultSet, error }) => (
  (resultSet && <Component resultSet={resultSet} title={text} />) ||
  (error && error.toString()) ||
  (<Spin />)
)

const WEEKDAYS_SHORT = {
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  it: ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'],
};
const MONTHS = {
  ru: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
  it: [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ],
};

const WEEKDAYS_LONG = {
  ru: [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
  ],
  it: [
    'Domenica',
    'Lunedì',
    'Martedì',
    'Mercoledì',
    'Giovedì',
    'Venerdì',
    'Sabato',
  ],
};

const FIRST_DAY_OF_WEEK = {
  ru: 1,
  it: 1,
};
// Translate aria-labels
const LABELS = {
  ru: { nextMonth: 'следующий месяц', previousMonth: 'предыдущий месяц' },
  it: { nextMonth: 'Prossimo mese', previousMonth: 'Mese precedente' },
};



const AppLayout = ({ children }) => (
  <Layout
    style={{
      height: "100%"
    }}
  >
    <Header />
    <Layout.Content>{children}</Layout.Content>
  </Layout>
);



class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: allOkrugs,
      dateFilter: undefined,
      dateFilterText: "All time",
      granularity: "month",
      from: undefined,
      to: undefined,
    };

    this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
    this.dateFilterChange = this.dateFilterChange.bind(this);
    this.granularityChange = this.granularityChange.bind(this);
    this.handleFromChange = this.handleFromChange.bind(this);
    this.handleToChange = this.handleToChange.bind(this);
  }

  showFromMonth() {
    const from = this.state.from;
    const to = this.state.to;
    if (!from) {
      return;
    }
    if (moment(to).diff(moment(from), 'months') < 2) {
      this.to.getDayPicker().showMonth(from);
    }
  }

  handleFromChange(from) {
    // Change the from date and focus the "to" input field
    if (this.state.to == undefined)
      this.setState({ from: from });
    else
      this.setState({
        from: from,
        dateFilter: [from, this.state.to]
      });

  }

  handleToChange(to) {
    if (this.state.from == undefined)
      this.setState({ to }, this.showFromMonth);
    else
      this.setState({
        to: to,
        dateFilter: [this.state.from, to]
      }, this.showFromMonth);
  }


  handleFilterTextChange(filterText) {
    if (filterText.length > 0) {
      this.setState({
        filter: filterText.map((x) => x)
      });
    } else {
      this.setState({
        filter: allOkrugs.map((x) => x)
      });
    }
  }

  dateFilterChange(filterText) {
    var filter = filterText
    if (filterText === "All time")
      filter = undefined;
    if (filterText === "Custom")
      if (this.state.from != undefined && this.state.to != undefined)
        this.setState({
          dateFilterText: filterText,
          dateFilter: [this.state.from, this.state.to],
        })
      else
        this.setState({
          dateFilterText: filterText,
        });
    else
      this.setState({
        dateFilterText: filterText,
        dateFilter: filter,
      });
  }

  granularityChange(filterText) {
    this.setState({
      granularity: filterText
    });
  }


  render() {
    const from = this.state.from;
    const to = this.state.to;
    const modifiers = { start: from, end: to };
    return (
      <Container fluid>
        <Row className="headerRow">
          <Col className="headerRow_row_1">
          {<img className="cism-logo" src="https://www.cism-ms.ru/local/templates/cism/img/logo.png"></img>}
          </Col>
          <Col className="headerRow_row_2">
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Поиск объекта..."
              defaultValue={okrugFilter}
              onSelect={okr => { okrugFilter.push(okr); this.handleFilterTextChange(okrugFilter); }}
              onDeselect={okr => {
                const index = okrugFilter.indexOf(okr);
                if (index > -1) {
                  okrugFilter.splice(index, 1);
                }
                this.handleFilterTextChange(okrugFilter);
              }}
            >

              {allOkrugs.map(value => (
                <Select.Option key={value} value={value}>
                  {value}
                </Select.Option>
              ))}
            </Select>
            
          </Col>
          <Col className="headerRow_row_3">
            <ButtonGroup style={{ borderColor: 'white' }}>
              {[["Last year", "Последний год"], ["Last 2 years", "2 года"], ["Last 3 years", "3 года"], ["All time", "Всё время"], ["Custom", "Свой период"]].map(value => (
                <Button style={{ borderColor: 'white' }}
                  variant={(value[0] === this.state.dateFilterText) ? "contained" : ""}
                  onClick={() => this.dateFilterChange(value[0])}
                  value={value[0]}>
                  {value[1]}
                </Button>
              ))}
            </ButtonGroup>
            {this.state.dateFilterText != "Custom" ? null : <div className="InputFromTo">
              <DayPickerInput

                value={from}
                placeholder="С"
                dayPickerProps={{
                  months: MONTHS["ru"],
                  weekdaysLong: WEEKDAYS_LONG["ru"],
                  firstDayOfWeek: FIRST_DAY_OF_WEEK["ru"],
                  labels: LABELS["ru"],

                  selectedDays: [from, { from, to }],
                  disabledDays: { after: to },
                  toMonth: to,
                  modifiers,
                  numberOfMonths: 2,
                  onDayClick: () => this.to.getInput().focus(),
                }}
                onDayChange={this.handleFromChange}
              />{' '}
        {' '}
              <span className="InputFromTo-to">
                <DayPickerInput


                  ref={el => (this.to = el)}
                  value={to}
                  placeholder="По"
                  dayPickerProps={{
                    months: MONTHS["ru"],
                    weekdaysLong: WEEKDAYS_LONG["ru"],
                    firstDayOfWeek: FIRST_DAY_OF_WEEK["ru"],
                    labels: LABELS["ru"],

                    selectedDays: [from, { from, to }],
                    disabledDays: { before: from },
                    modifiers,
                    month: from,
                    fromMonth: from,
                    numberOfMonths: 2,
                  }}
                  onDayChange={this.handleToChange}
                />
              </span>
            </div>}
            
          </Col>
          <Col className="headerRow_row_4">
          <ButtonGroup style={{ borderColor: 'white' }}>
              {[["day", "День"], ["week", "Неделя"], ["month", "Месяц"], ["year", "Год"]].map(value => (
                <Button style={{ borderColor: 'white' }}
                  variant={value[0] === this.state.granularity ? "contained" : ""}
                  onClick={() => this.granularityChange(value[0])}
                  value={value[0]}>
                  {value[1]}
                </Button>
              ))}
            </ButtonGroup>
          </Col>
        </Row>
      {<div className="all_charts">
        {<div className="left_icons" >
          {<div className="first_icon_div"><img className="cism-icon_first" src="images/map_icon.png"></img></div>}
          {<div className="second_icon_div"><img className="cism-icon_second" src="images/second_icon.png"></img></div>}
        </div>}
      {<div className="graphics_class">
        <Col className="app_column app_column_1">
          <Col className="column_widget_1">
          <h5>Общие показатели по стране</h5>
            <Layout.Content style={{ padding: "15px" }}>
              <QueryRenderer

                query={{
                  "measures": [
                    "GeoData.population"
                  ],
                  "timeDimensions": [],
                  "filters": [
                    {
                      "dimension": "GeoData.okrug",
                      "operator": "equals",
                      "values":
                        this.state.filter

                    }
                  ]
                }}
                cubejsApi={cubejsApi}
                render={renderChart(numberRender, "Население городов:")}
              />
              <QueryRenderer
                query={{
                  "measures": [
                    "Incidents.aue"
                  ],
                  "timeDimensions": [
                    {
                      "dimension": "Incidents.date",
                      "granularity": this.state.granularity,
                      "dateRange": this.state.dateFilter
                    }
                  ],
                  "filters": [
                    {
                      "dimension": "GeoData.okrug",
                      "operator": "equals",
                      "values":
                        this.state.filter

                    }
                  ]
                }}
                cubejsApi={cubejsApi}
                render={renderChart(numberRender, "Число инцидентов ауе:")}
              />
            </Layout.Content>
          </Col>
          <Col className="column_widget_2">
            <h5>Число инцидентов ауе, округа:</h5>
            <QueryRenderer
              query={{
                "measures": [
                  "Incidents.aue"
                ],
                "timeDimensions": [
                  {
                    "dimension": "Incidents.date",
                    "dateRange": this.state.dateFilter
                  }
                ],
                "dimensions": [
                  "GeoData.okrug"
                ],
                "filters": [
                  {
                    "dimension": "GeoData.okrug",
                    "operator": "equals",
                    "values":
                      this.state.filter

                  }
                ]
              }}
              cubejsApi={cubejsApi}
              render={({ resultSet }) => {
                if (!resultSet) {
                  return "Loading...";
                }
                return (
                  <ResponsiveContainer width="100%" height={500}>
                    <PieChart >
                      <Pie 
                      
                        isAnimationActive={false}
                        data={resultSet.chartPivot()}
                        nameKey="x"
                        dataKey={resultSet.seriesNames().length > 0 ? resultSet.seriesNames()[0].key : null}
                        fill="#8884d8">
                        {
                          resultSet.chartPivot().map((e, index) =>
                            <Cell key={index} fill={colors[index % colors.length]} />
                          )
                        }
                      </Pie>
                      <Legend iconType="circle" iconSize="11"/>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                );
              }}
            />
          </Col>
        </Col>
        <Col className="app_column app_column_2">
        <Col className="column_widget_3">
            <h5>Число инцидентов:</h5>
            <QueryRenderer
              query={{
                "measures": [
                  "Incidents.aue",
                  "Incidents.suicides"
                ],
                "timeDimensions": [
                  {
                    "dimension": "Incidents.date",
                    "granularity": this.state.granularity,
                    "dateRange": this.state.dateFilter
                  }
                ],
                "filters": [
                  {
                    "dimension": "GeoData.okrug",
                    "operator": "equals",
                    "values":
                      this.state.filter

                  }
                ]
              }}
              cubejsApi={cubejsApi}
              render={({ resultSet }) => {
                if (!resultSet) {
                  return "Loading...";
                }
                return (
                  <ResponsiveContainer width="95%" height={350}>

                    <ComposedChart data={resultSet.chartPivot()}
                    >
                      <CartesianGrid stroke="#f5f5f5" />
                      <XAxis dataKey="x" orientation={'bottom'} tickMargin={25}  angle={30}  tickFormatter={(tickItem) => moment(tickItem).format('DD.MM.YYYY')} />
                      <YAxis />
                      <Tooltip labelFormatter={t => moment(t).format('DD.MM.YYYY')} />
                      <Bar dataKey="Incidents.aue" name="ауе" barSize={20} fill="#44a1ff" />
                      <Line type="monotone" dataKey="Incidents.suicides" name="суициды" stroke="#ff7300" />
                      <Legend iconType="circle" iconSize="11"/>
                      {/* <Scatter dataKey="cnt" fill="red" /> */}
                    </ComposedChart>
                  </ResponsiveContainer>
                );
              }}
            />
          </Col>
          
          
        </Col>
        <Col className="app_column app_column_3">
          <Col className="column_widget_5">
              <h5>Население городов, регионы:</h5><QueryRenderer
                query={{
                  "measures": [
                    "GeoData.population"
                  ],
                  "timeDimensions": [],
                  "filters": [
                    {
                      "dimension": "GeoData.okrug",
                      "operator": "equals",
                      "values":
                        this.state.filter

                    }
                  ],
                  "dimensions": [
                    "GeoData.region"
                  ]
                }}
                cubejsApi={cubejsApi}
                render={({ resultSet, measures, availableMeasures, updateMeasures }) => {
                  if (!resultSet) {
                    return "Loading...";
                  }
                  return (
                    <ResponsiveContainer width="80%" margin={{left:40}} height={180}>
                      <BarChart data={resultSet.chartPivot()}>
                        
                        <Tooltip />
                        <Bar dataKey="GeoData.population" name="Численность населения" fill="rgba(239, 65, 54)" />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                }}
              />
            </Col>
          </Col>
        <Col className="app_column app_column_4">
          <Col className="column_widget_4"><h5>Число суицидов:</h5>
            <QueryRenderer
              query={{
                "measures": [
                  "Incidents.suicides"
                ],
                "timeDimensions": [
                  {
                    "dimension": "Incidents.date",
                    "granularity": this.state.granularity,
                    "dateRange": this.state.dateFilter
                  }
                ],
                "filters": [
                  {
                    "dimension": "GeoData.okrug",
                    "operator": "equals",
                    "values":
                      this.state.filter

                  }
                ]
              }}
              cubejsApi={cubejsApi}
              render={({ resultSet }) => {
                if (!resultSet) {
                  return "Loading...";
                }
                return (
                  <ResponsiveContainer width="95%" height={250}>
                    <AreaChart data={resultSet.chartPivot()}>
                      <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f00" stopOpacity={1} />
                          <stop offset="95%" stopColor="#f00" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="x" tickMargin={25}  angle={30} tickFormatter={(tickItem) => moment(tickItem).format('DD.MM.YYYY')}/>
                      <YAxis />
                      <Legend dataKey="name"  iconType="circle" iconSize="11"/>
                      <Tooltip labelFormatter={t => moment(t).format('DD.MM.YYYY')}
                      style={{ textAnchor: 'middle', fontSize: '80%', fill: 'rgba(0, 0, 0, 0.87)'}}/>
                      <Area type="monotone" dataKey="Incidents.suicides" name="суициды" stroke="#f00" fillOpacity={1} fill="url(#colorUv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              }}
            />
          </Col>
          </Col>

        </div>}
        </div>}
      </Container>
    );
  }
}

/*const App = ({ children }) => (
  <CubeProvider cubejsApi={cubejsApi}>
    <ApolloProvider client={client}>
      <AppLayout>{children}</AppLayout>
    </ApolloProvider>
  </CubeProvider>
);*/

export default App;
